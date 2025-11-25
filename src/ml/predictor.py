import xgboost as xgb
import pandas as pd
import numpy as np
import os
from src.config import MODEL_PATH
# from src.processing.gis_processor import GisProcessor # Có thể tạm ẩn nếu giscontent được truyền trực tiếp

class SafetyPredictor:
    def __init__(self):
        self.model = None
        # self.gis = GisProcessor() # Tạm thời không dùng logic GIS cũ nếu input đã có giscontent
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = xgb.XGBRegressor()
            self.model.load_model(MODEL_PATH)
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")

    def predict_score(self, data):
        """
        Tính điểm dựa trên format dữ liệu mới.
        data: Object SafetyInput
        """
        
        # --- BƯỚC 1: XÁC ĐỊNH ĐIỂM CƠ SỞ (BASE SCORE) ---
        # 100 điểm là an toàn tuyệt đối. Trừ dần dựa trên các mối đe dọa.
        current_score = 100.0
        
        # --- BƯỚC 2: TRỪ ĐIỂM DỰA TRÊN CÁC CHỈ SỐ CỤ THỂ (METRICS) ---
        
        # A. Mưa (Precipitation) - Sử dụng ngưỡng chuẩn hóa
    # Ví dụ: > 2.0 (tức là cao hơn trung bình 2 độ lệch chuẩn) là mưa lớn
        if data.precip24 > 2.0: 
            penalty = (data.precip24 - 2.0) * 10
            current_score -= min(40, penalty)
            
        # B. Gió (Gust)
        # Ví dụ: Gust Z-score > 1.5 là gió mạnh đáng kể
        if data.gust6 > 1.5:
            # Ở input này gust6 = 1.98 (> 1.5), code sẽ chạy vào đây
            penalty = (data.gust6 - 1.5) * 15
            current_score -= min(30, penalty)
            
        # C. Động đất (Earthquake)
        # eq_mag -1.3 nghĩa là rất thấp hoặc không có số liệu, không trừ điểm
        if data.eq_mag > 2.0: 
            current_score -= 50

        # D. Lũ (River Discharge)
        # Giả định ngưỡng cảnh báo là X (cần chuẩn hóa dữ liệu này)
        if data.river_discharge > 1000: # Ví dụ ngưỡng giả định
             current_score -= 10

        # --- BƯỚC 3: ĐIỀU CHỈNH BẰNG NHÃN DỰ BÁO (LABELS) ---
        # Nếu các nhãn label báo nguy hiểm, trừ thêm điểm "phạt" để đảm bảo an toàn
        
        risk_labels = [data.rain_label, data.storm_label, data.flood_label]
        high_risk_count = sum(1 for label in risk_labels if str(label).lower() in ['high', 'danger', 'severe'])
        
        current_score -= (high_risk_count * 15)

        # Xử lý overall_hazard_prediction (Nếu model khác báo nguy hiểm, score không được cao)
        if str(data.overall_hazard_prediction).lower() in ['high', 'extreme']:
            current_score = min(current_score, 40.0) # Kẹp trần tối đa là 40 điểm
        elif str(data.overall_hazard_prediction).lower() == 'medium':
            current_score = min(current_score, 70.0)

        # --- BƯỚC 4: XỬ LÝ GIS CONTENT (Nếu có) ---
        if data.giscontent:
            # Ví dụ: Nếu giscontent chứa thông tin vùng trũng thấp
            pass 

        # Kẹp giá trị 0-100
        final_score = max(0.0, min(100.0, current_score))
        
        return final_score