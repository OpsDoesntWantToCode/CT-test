import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Import tiện ích tính khoảng cách
from app.core.gis_utils import haversine_distance

router = APIRouter()

# --- CẤU HÌNH ---
# Đường dẫn đến file JSON đã được script process_data_integrated.py tạo ra
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JSON_FILE_PATH = os.path.join(BASE_DIR, "data", "processed", "processed_risk_zones.json")
SEARCH_RADIUS_KM = 50.0

# Load dữ liệu vào RAM khi khởi động
risk_data = []
if os.path.exists(JSON_FILE_PATH):
    with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
        risk_data = json.load(f)
    print(f"✅ [MapRouter] Đã load {len(risk_data)} vùng rủi ro.")
else:
    print(f"⚠️ [MapRouter] Cảnh báo: Không tìm thấy {JSON_FILE_PATH}. Hãy chạy process_data_integrated.py trước.")

# --- MODELS ---
class UserLocation(BaseModel):
    lat: float
    lon: float

# --- ENDPOINTS ---

@router.get("/zones")
def get_all_risk_zones():
    """
    API trả về toàn bộ vùng rủi ro để vẽ lên bản đồ (Frontend load 1 lần).
    """
    map_display_data = []
    
    for event in risk_data:
        # Chuyển đổi GeoJSON sang format Leaflet/Google Maps cần
        # GeoJSON: [Lon, Lat] -> Leaflet: [Lat, Lon]
        raw_polygon = event.get("impact_polygon")
        leaflet_path = []
        
        if raw_polygon and "coordinates" in raw_polygon:
            try:
                coords = raw_polygon["coordinates"][0] # Lấy ring đầu tiên
                leaflet_path = [[p[1], p[0]] for p in coords]
            except Exception:
                continue

        map_display_data.append({
            "id": event.get("location_name"),
            "center": [event.get("lat"), event.get("lon")],
            "risk_level": event.get("risk_level"),
            "color": event.get("color_code"),
            "path": leaflet_path,
            "info": {
                "type": event.get("disaster_type"),
                "score": event.get("safety_score")
            }
        })
        
    return map_display_data

@router.post("/check-risk")
def check_risk_nearby(location: UserLocation):
    """
    API nhận tọa độ người dùng -> Trả về cảnh báo nếu có rủi ro trong 50km
    """
    user_lat = location.lat
    user_lon = location.lon
    
    nearby_risks = []
    closest_risk = None
    min_dist = float('inf')
    
    for event in risk_data:
        # Tính khoảng cách
        e_lat = event.get("lat")
        e_lon = event.get("lon")
        
        if e_lat is None or e_lon is None: continue
            
        dist = haversine_distance(user_lat, user_lon, e_lat, e_lon)
        
        if dist <= SEARCH_RADIUS_KM:
            risk_info = {
                "location": event.get("location_name"),
                "type": event.get("disaster_type"),
                "distance_km": round(dist, 1),
                "level": event.get("risk_level"),
                "score": event.get("safety_score")
            }
            nearby_risks.append(risk_info)
            
            if dist < min_dist:
                min_dist = dist
                closest_risk = event
    
    # Sắp xếp theo khoảng cách
    nearby_risks.sort(key=lambda x: x["distance_km"])
    
    if nearby_risks:
        return {
            "status": "WARNING",
            "message": f"Phát hiện {len(nearby_risks)} rủi ro gần bạn!",
            "nearest_risk": nearby_risks[0],
            "all_risks": nearby_risks,
            "safety_score": closest_risk.get("safety_score")
        }
    else:
        return {
            "status": "SAFE",
            "message": "Khu vực an toàn. Không phát hiện rủi ro trong 50km.",
            "safety_score": 100
        }