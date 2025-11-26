import pandas as pd
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --- Import Module nội bộ ---
# Đảm bảo bạn đang đứng ở thư mục gốc để Python tìm thấy package 'app'
from app.core.gis_utils import calculate_influence_area, get_risk_classification
from app.ml.predictor import SafetyPredictor 

# 1. CẤU HÌNH DATABASE (PostgreSQL + PostGIS)
# Lưu ý: Nên đưa chuỗi kết nối này vào biến môi trường (.env) để bảo mật
DATABASE_URL = "postgresql://postgres:123@localhost:5432/itss_database"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def process_integrated_data(csv_file_path):
    # Kiểm tra file input
    if not os.path.exists(csv_file_path):
        print(f"❌ Không tìm thấy file dữ liệu: {csv_file_path}")
        return

    print("⏳ Đang khởi tạo AI Model...")
    try:
        # Khởi tạo class dự đoán từ Repo 2
        ai_predictor = SafetyPredictor()
        print("✅ AI Model đã sẵn sàng!")
    except Exception as e:
        print(f"❌ Lỗi khởi tạo AI (Kiểm tra lại đường dẫn model): {e}")
        return

    # Đọc dữ liệu từ CSV
    df = pd.read_csv(csv_file_path)
    
    # Lọc bỏ những dòng không có cảnh báo rủi ro (tùy chọn, dựa trên logic cũ)
    # Nếu muốn chấm điểm cho TẤT CẢ địa điểm, hãy comment dòng dưới đây lại
    if 'overall_hazard_prediction' in df.columns:
        risk_df = df[df['overall_hazard_prediction'] != 'No'].copy()
    else:
        risk_df = df.copy() # Xử lý hết nếu không có cột lọc
    
    results = []
    db = SessionLocal()
    
    print(f"--- BẮT ĐẦU XỬ LÝ {len(risk_df)} ĐỊA ĐIỂM ---")

    try:
        for index, row in risk_df.iterrows():
            # --- PHẦN 1: CHUẨN BỊ INPUT CHO AI (THEO SCHEMA MỚI) ---
            # Mapping từ tên cột trong CSV -> tên trường trong SafetyInput
            # Cú pháp: row.get('TÊN_CỘT_TRONG_CSV', GIÁ_TRỊ_MẶC_ĐỊNH)
            
            ai_input_data = {
                # 1. Thông tin vị trí
                "location": str(row.get('location', 'Unknown Location')),
                "lat": float(row.get('lat', 0.0)),
                "lon": float(row.get('lon', 0.0)),

                # 2. Thông tin thời tiết cơ bản
                "temperature": float(row.get('temperature', 30.0)), # Hoặc 'temp' tùy CSV
                "humidity": float(row.get('humidity', 70.0)),
                "pressure": float(row.get('pressure', 1013.0)),     # Áp suất chuẩn
                "wind_speed": float(row.get('wind_speed', 5.0)),

                # 3. Thông tin nâng cao (Mưa, Gió giật)
                "precip6": float(row.get('precip6', 0.0)),          # Mưa 6h
                "precip24": float(row.get('precip24', 0.0)),        # Mưa 24h
                "gust6": float(row.get('gust6', 0.0)),              # Gió giật 6h

                # 4. Thông tin thiên tai (Thủy văn, Động đất)
                # Lưu ý: Schema quy định -1.0 là không có dữ liệu
                "river_discharge": float(row.get('river_discharge', -1.0)),
                "eq_mag": float(row.get('eq_mag', -1.0)),
                "eq_dist": float(row.get('eq_dist', -1.0))
            }
            
            # --- PHẦN 2: GỌI AI ĐỂ TÍNH ĐIỂM ---
            try:
                # Hàm predict trả về dict (vd: {'safety_score': 85, 'risk_level': 'Low', ...})
                prediction = ai_predictor.predict_safety_score(ai_input_data)
                
                final_safety_score = prediction.get('safety_score', 50)
                ai_risk_level = prediction.get('risk_level', 'Info')
            except Exception as e:
                # Fallback nếu AI lỗi (do thiếu trường dữ liệu hoặc model lỗi)
                # print(f"⚠️ AI Skip dòng {index}: {e}")
                final_safety_score = 50
                ai_risk_level = "Unknown"

            # --- PHẦN 3: TÍNH VÙNG ẢNH HƯỞNG BẰNG GIS (Logic cũ) ---
            # Cần xác định loại thảm họa và cường độ để vẽ vòng tròn
            # Logic này lấy từ cột 'overall_hazard_prediction' của CSV cũ
            disaster_type = str(row.get('overall_hazard_prediction', 'unknown')).lower()
            
            # Tính cường độ (Intensity) để vẽ bán kính
            intensity = 0.0
            if 'storm' in disaster_type or 'wind' in disaster_type:
                intensity = ai_input_data['wind_speed']
            elif 'earthquake' in disaster_type:
                intensity = max(0, ai_input_data['eq_mag'])
            elif 'flood' in disaster_type:
                intensity = max(0, ai_input_data['river_discharge'])

            # Gọi PostGIS vẽ Polygon
            polygon = calculate_influence_area(db, ai_input_data['lat'], ai_input_data['lon'], disaster_type, intensity)
            
            # Lấy màu sắc hiển thị (Dùng logic cũ hoặc lấy từ AI đều được)
            color_info = get_risk_classification(final_safety_score)
            
            # --- PHẦN 4: TỔNG HỢP KẾT QUẢ ---
            event_result = {
                "location_name": ai_input_data['location'],
                "lat": ai_input_data['lat'],
                "lon": ai_input_data['lon'],
                "disaster_type": disaster_type,
                "intensity": intensity,
                "safety_score": int(final_safety_score),
                "risk_level": ai_risk_level,    # Dùng kết quả text từ AI (Low/High...)
                "color_code": color_info['color_code'], # Màu sắc để vẽ lên map
                "impact_polygon": polygon       # GeoJSON vùng ảnh hưởng
            }
            results.append(event_result)
            
            if len(results) % 50 == 0:
                print(f"🚀 Đã xử lý {len(results)} địa điểm...")

    except Exception as e:
        print(f"❌ Lỗi trong vòng lặp chính: {e}")
    finally:
        db.close()

    # --- PHẦN 5: LƯU RA FILE JSON ---
    output_dir = os.path.join("data", "processed")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "processed_risk_zones.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 HOÀN TẤT! Đã lưu {len(results)} kết quả vào: {output_file}")

if __name__ == "__main__":
    # Thay 'normalized_data.csv' bằng tên file CSV dữ liệu thực tế của bạn
    process_integrated_data('normalized_data.csv')