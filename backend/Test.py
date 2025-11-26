import json
import os
from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
# Import các hàm tiện ích
from utils import get_risk_classification, haversine_distance

# ---- CẤU HÌNH ----
JSON_FILE_PATH = "processed_risk_zones.json" # File dữ liệu thật từ code process_data.py
SEARCH_RADIUS_KM = 50.0 # Bán kính cảnh báo (50km)

# ---- 1. LOAD DỮ LIỆU JSON VÀO BỘ NHỚ KHI KHỞI ĐỘNG ----
risk_data = []
if os.path.exists(JSON_FILE_PATH):
    with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
        risk_data = json.load(f)
    print(f"✅ [INIT] Đã load {len(risk_data)} sự kiện rủi ro từ file JSON.")
else:
    print("⚠️ [WARNING] Không tìm thấy file processed_risk_zones.json!")

# ---- 2. MODEL INPUT ----
class LocationModel(BaseModel):
    lat: float
    lon: float

app = FastAPI()
@app.get("/api/risk-zones")
def get_risk_zones_for_map():
    """
    API trả về danh sách toàn bộ các vùng rủi ro để vẽ lên bản đồ.
    Output được format chuẩn để Frontend (Leaflet) dùng luôn mà không cần tính toán lại.
    """
    map_data = []
    
    for event in risk_data:
        # 1. Xử lý Polygon: Chuyển từ GeoJSON [Lon, Lat] sang Leaflet [Lat, Lon]
        raw_polygon = event.get("impact_polygon")
        leaflet_path = []
        
        if raw_polygon and "coordinates" in raw_polygon:
            try:
                # GeoJSON chuẩn thường là mảng 3 chiều: [ [ [lon, lat], ... ] ]
                # Lấy vòng đầu tiên (ring 0)
                coords = raw_polygon["coordinates"][0]
                # Đảo ngược từng điểm: [lon, lat] -> [lat, lon]
                leaflet_path = [[p[1], p[0]] for p in coords]
            except Exception as e:
                print(f"⚠️ Lỗi xử lý polygon cho {event.get('location_name')}: {e}")
                continue

        # 2. Map mức độ rủi ro sang format của Frontend (high/medium/low/safe)
        raw_level = event.get("risk_level", "Info")
        severity_mapping = {
            "High": "high",
            "Medium": "medium",
            "Low": "low",
            "Info": "safe" 
        }
        severity = severity_mapping.get(raw_level, "safe")

        # 3. Tạo object kết quả
        zone_data = {
            "id": event.get("location_name"), # Dùng tên làm ID tạm
            "name": event.get("location_name"),
            "severity": severity,
            "type": "polygon",     # Báo cho frontend biết đây là đa giác
            "center": [event.get("lat"), event.get("lon")],
            "path": leaflet_path   # Mảng tọa độ [Lat, Lon]
        }
        map_data.append(zone_data)
        
    return map_data
app.add_middleware(
    CORSMiddleware,
    # Cho phép các nguồn này gọi API.     
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], # Cho phép mọi phương thức: GET, POST, PUT...
    allow_headers=["*"], # Cho phép mọi loại header
)
# Trong file Test.py

@app.post("/api/v1/risk-analysis")
async def analyze_risk(user_location: LocationModel):
    user_lat = user_location.lat
    user_lon = user_location.lon
    
    # Danh sách chứa các rủi ro tìm thấy
    nearby_risks = []
    
    # Biến lưu cái gần nhất để tính điểm safety score (giữ logic cũ)
    closest_event = None
    min_dist = float('inf')

    # 1. QUÉT TẤT CẢ SỰ KIỆN
    for event in risk_data:
        try:
            event_lat = event.get("lat")
            event_lon = event.get("lon")
            if event_lat is None or event_lon is None: continue 

            # Tính khoảng cách
            dist = haversine_distance(user_lat, user_lon, event_lat, event_lon)
            
            # Nếu nằm trong bán kính tìm kiếm (50km)
            if dist <= SEARCH_RADIUS_KM:
                # Thêm vào danh sách nearby
                nearby_risks.append({
                    "disaster_type": event.get("disaster_type"),
                    "location": event.get("location_name"),
                    "distance": round(dist, 1), # Làm tròn 1 số lẻ
                    "severity": event.get("risk_level"), # High/Medium/Low
                    "time_ago": "Just now" # Giả lập thời gian
                })

                # Logic tìm min_dist cũ để tính điểm chính
                if dist < min_dist:
                    min_dist = dist
                    closest_event = event
        except Exception:
            continue
    
    # Sắp xếp danh sách rủi ro theo khoảng cách (gần nhất lên đầu)
    nearby_risks.sort(key=lambda x: x["distance"])

    # 2. TRẢ VỀ KẾT QUẢ
    if closest_event:
        safety_score = closest_event.get("safety_score", 50)
        classification = get_risk_classification(safety_score)
        
        return {
            "status": "WARNING",
            "message": f"Phát hiện {len(nearby_risks)} mối nguy hiểm trong bán kính 50km",
            "safety_score": safety_score,
            "risk_level": classification.get("level"),
            "nearby_risks": nearby_risks,  # <--- TRẢ VỀ DANH SÁCH MỚI Ở ĐÂY
            "map_display": {
                "color_code": classification.get("color_code"),
                "risk_polygon": closest_event.get("impact_polygon") 
            }
        }
    else:
        return {
            "status": "SAFE",
            "message": "Không phát hiện rủi ro nào gần đây.",
            "safety_score": 100,
            "risk_level": "Info",
            "nearby_risks": [], # Danh sách rỗng
            "map_display": {
                "color_code": "#28A745",
                "risk_polygon": None
            }
        }

@app.get("/api/v1/locations")
def get_all_locations():
    """Trả về danh sách tất cả địa điểm để làm Search Bar"""
    locations = []
    for event in risk_data:
        locations.append({
            "name": event.get("location_name"),
            "lat": event.get("lat"),
            "lon": event.get("lon"),
            "type": event.get("disaster_type"),
            "severity": event.get("risk_level")
        })
    return locations

if __name__ == "__main__":
    uvicorn.run("Test:app", host="127.0.0.1", port=8000, reload=True)