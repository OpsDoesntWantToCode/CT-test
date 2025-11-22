import xgboost as xgb
import pandas as pd
import numpy as np
import os
from src.config import MODEL_PATH
from src.processing.gis_processor import GisProcessor

class SafetyPredictor:
    def __init__(self):
        self.model = None
        self.gis = GisProcessor()
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = xgb.XGBRegressor()
            self.model.load_model(MODEL_PATH)
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")

    def is_point_in_polygon(self, lat, lon, geo_polygon):
        """Kiểm tra điểm nằm trong đa giác (GeoJSON format)"""
        if not geo_polygon or not geo_polygon.coordinates:
            return False
        # Lấy vòng cung ngoài cùng (Exterior Ring)
        points = geo_polygon.coordinates[0] 
        inside = False
        j = len(points) - 1
        for i in range(len(points)):
            p1_lon, p1_lat = points[i][0], points[i][1]
            p2_lon, p2_lat = points[j][0], points[j][1]
            if ((p1_lat > lat) != (p2_lat > lat)) and \
               (lon < (p2_lon - p1_lon) * (lat - p1_lat) / (p2_lat - p1_lat + 1e-9) + p1_lon):
                inside = not inside
            j = i
        return inside

    def predict_score(self, lat, lon, month, weather_context, risk_polygon=None):
        """
        Dự đoán điểm an toàn dựa trên:
        1. Lịch sử & Địa hình (XGBoost) -> Trần điểm an toàn.
        2. Thời tiết thực tế -> Trừ điểm.
        3. Vùng rủi ro (Polygon) -> Thiết lập mức rủi ro tối thiểu (Sàn).
        """
        
        # 1. XGBoost: Tính toán Trần điểm an toàn (Safety Ceiling)
        # Vùng địa lý xấu (lũ lụt nhiều) sẽ có trần điểm thấp hơn.
        land_cover = self.gis.get_land_cover(lat, lon)
        input_data = pd.DataFrame({'Latitude': [lat], 'Longitude': [lon], 'Start Month': [month], 'land_cover': [land_cover]})
        
        try:
            log_risk = self.model.predict(input_data)[0] if self.model else 0
            log_risk = max(0, log_risk)
        except:
            log_risk = 5.0

        # Công thức trần: 100 - (LogRisk * 1.2)
        # VD: Rốn lũ (Risk=10) -> Max điểm là 88. An toàn (Risk=0) -> Max điểm là 100.
        safety_ceiling = 100.0 - (log_risk * 1.2)

        # 2. Đánh giá Mối đe dọa từ Thời tiết (Threat Assessment)
        w_speed = weather_context.get('wind_speed', 0)
        rain_prob = weather_context.get('rain_prob', 0)
        storm_prob = weather_context.get('storm_prob', 0)

        # Gió: >20km/h mới tính. Max 100đ.
        threat_wind = 0
        if w_speed > 20:
            threat_wind = min(100, (w_speed - 20) * 1.0)
            
        # Mưa: Max 50đ
        threat_rain = rain_prob * 50 
        
        # Bão: Max 90đ
        threat_storm = storm_prob * 90

        # Lấy yếu tố nguy hiểm nhất làm chủ đạo
        current_threat = max(threat_wind, threat_rain, threat_storm)
        
        # Cộng thêm 10% từ các yếu tố phụ
        secondary_threat = (threat_wind + threat_rain + threat_storm) - current_threat
        current_threat += secondary_threat * 0.1

        # 3. XỬ LÝ RISK POLYGON (Logic mới: Không phạt cộng dồn)
        if risk_polygon:
            if self.is_point_in_polygon(lat, lon, risk_polygon):
                print("DEBUG: User is INSIDE Risk Polygon.")
                
                # Nếu nằm trong vùng rủi ro được khoanh vùng (nhưng không có số liệu thời tiết riêng):
                # Ta giả định đây là vùng cảnh báo cấp 1.
                # Đảm bảo Threat Score ít nhất là 30 (Mức cảnh báo/Vàng).
                # Nếu thời tiết thực tế đã xấu hơn 30 (ví dụ bão), thì giữ nguyên số xấu đó.
                # Nếu thời tiết thực tế đang tốt (mắt bão/sai số), thì nâng lên 30.
                current_threat = max(current_threat, 30.0)
                
            else:
                print("DEBUG: User is OUTSIDE Risk Polygon.")

        # 4. Tính điểm cuối cùng
        final_score = safety_ceiling - current_threat
        
        # Kẹp giá trị 0-100
        final_score = max(0.0, min(100.0, final_score))
        
        print(f"DEBUG -> Ceiling: {safety_ceiling:.2f} | Threat: {current_threat:.2f}")
        print(f"FINAL SCORE: {final_score:.2f}")

        return final_score