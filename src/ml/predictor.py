# src/ml/predictor.py
import xgboost as xgb
import pandas as pd
import numpy as np
import joblib
from src.schemas.safety_schema import SafetyInput

class SafetyPredictor:
    def __init__(self, model_path="data/models/xgboost_safety.json"):
        self.model = xgb.XGBRegressor()
        self.model.load_model(model_path)
        # Tải danh sách feature đã lưu lúc train để đảm bảo đúng thứ tự
        try:
            self.features = joblib.load("data/models/features_list.pkl")
        except:
            # Fallback nếu không tìm thấy file (phải khớp với lúc train)
            self.features = [
                'lat', 'lon', 'temperature', 'humidity', 'pressure', 
                'wind_speed', 'precip6', 'precip24', 'gust6', 
                'river_discharge', 'eq_mag', 'eq_dist'
            ]

    def predict_risk(self, input_data: SafetyInput):
        # 1. Chuyển đổi Input Pydantic thành DataFrame/dict
        data_dict = input_data.dict()
        
        # 2. Tạo DataFrame chỉ chứa các feature cần thiết theo đúng thứ tự
        input_df = pd.DataFrame([data_dict])[self.features]
        
        # 3. Dự đoán
        score = float(self.model.predict(input_df)[0])
        
        # Clip điểm số trong khoảng 0-100
        score = max(0.0, min(100.0, score))
        
        return score

    def get_risk_level(self, score):
        if score >= 80: return "Info"
        if score >= 50: return "Low"
        if score >= 25: return "Medium"
        return "High"