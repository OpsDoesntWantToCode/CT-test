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
            print("Model loaded successfully.")
        else:
            print(f"Model file not found at {MODEL_PATH}! Please run trainer.py first.")

    def predict_score(self, lat, lon, month, weather_context):
        if not self.model:
            return 50.0

        # 1. Lấy dữ liệu
        land_cover = self.gis.get_land_cover(lat, lon)
        input_data = pd.DataFrame({
            'Latitude': [lat],
            'Longitude': [lon],
            'Start Month': [month],
            'land_cover': [land_cover]
        })
        
        # 2. XGBoost: Tính hệ số tổn thương lịch sử
        try:
            predicted_log_risk = self.model.predict(input_data)[0]
            predicted_log_risk = max(0, predicted_log_risk)
        except:
            predicted_log_risk = 8.0 

        # --- TINH CHỈNH 1: Giảm ảnh hưởng của lịch sử ---
        # Cũ: chia cho 5.0 -> Hệ số nhân quá lớn (1.0 đến 4.0)
        # Mới: chia cho 12.0 -> Hệ số nhân nhẹ nhàng hơn (1.0 đến 2.2)
        # Nghĩa là: Dù vùng đó lịch sử xấu thế nào, nó chỉ làm tăng rủi ro gấp đôi, chứ không gấp 4.
        vulnerability_factor = 1.0 + (predicted_log_risk / 12.0)

        # 3. Tính Threat (Mối đe dọa từ thời tiết)
        threat_score = 0
        
        # --- TINH CHỈNH 2: Cân bằng lại trọng số thời tiết ---
        
        # Gió (km/h): Gió < 20km/h gần như không trừ điểm
        wind = weather_context.get('wind_speed', 0)
        if wind > 20:
            threat_score += (wind - 20) * 0.2  # Chỉ tính phần gió dư ra
        
        # Mưa (Probability): Giảm trọng số từ 20 xuống 15
        rain = weather_context.get('rain_prob', 0)
        threat_score += rain * 15
        
        # Bão (Probability): Giữ nguyên vì bão rất nguy hiểm
        storm = weather_context.get('storm_prob', 0)
        threat_score += storm * 40

        # 4. Tính phạt: Threat * History
        total_penalty = threat_score * vulnerability_factor
        
        # 5. Kết quả
        base_score = 100.0
        final_score = base_score - total_penalty
        final_score = max(0.0, min(100.0, final_score))
        
        # Debug log
        print(f"\nLocation: {lat}, {lon}")
        print(f"Log Risk: {predicted_log_risk:.2f} | Vuln Factor: {vulnerability_factor:.2f}")
        print(f"Threat: {threat_score:.2f} | Penalty: {total_penalty:.2f}")
        print(f"FINAL SCORE: {final_score:.2f}\n")
        
        return final_score