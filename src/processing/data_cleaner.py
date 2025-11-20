import pandas as pd
import numpy as np
from src.config import HISTORY_PATH

class DataCleaner:
    def load_data(self):
        try:
            # --- SỬA Ở ĐÂY: Thêm encoding='ISO-8859-1' ---
            # Nếu vẫn lỗi, bạn có thể thử encoding='cp1252'
            df = pd.read_csv(HISTORY_PATH, encoding='ISO-8859-1')
            
            # In ra danh sách cột để kiểm tra tên chính xác (Debug)
            print("Columns found:", df.columns.tolist())

            # Chọn các cột cần thiết
            # Lưu ý: Kiểm tra kỹ tên cột trong file CSV của bạn
            cols = ['Start Month', 'Latitude', 'Longitude', 'Total Deaths', 'No. Affected', 'Total Damage (\'000 US$)']
            
            # Chỉ giữ lại cột tồn tại
            existing_cols = [c for c in cols if c in df.columns]
            df = df[existing_cols].copy()
            
            # Fill NaN (Dữ liệu trống) bằng 0
            df.fillna(0, inplace=True)
            
            # --- Logic tính Risk Score ---
            # Total Damage thường chứa ký tự lạ, cần chuyển sang số trước
            if 'Total Damage (\'000 US$)' in df.columns:
                # Loại bỏ ký tự không phải số nếu có
                df['Total Damage (\'000 US$)'] = pd.to_numeric(df['Total Damage (\'000 US$)'], errors='coerce').fillna(0)

            # Tạo cột Risk Score (Target) để train
            # Logic: Càng nhiều người chết/ảnh hưởng -> Risk càng cao
            # Ta dùng .get() để tránh lỗi nếu cột không tồn tại
            deaths = df.get('Total Deaths', 0)
            affected = df.get('No. Affected', 0)
            damage = df.get('Total Damage (\'000 US$)', 0)

            df['risk_score_raw'] = (deaths * 10) + (affected * 0.5) + (damage * 0.01)
            
            # Chuẩn hóa Log để giảm ảnh hưởng outlier
            df['target'] = np.log1p(df['risk_score_raw'])
            
            print(f"Loaded {len(df)} rows successfully.")
            return df
        except Exception as e:
            print(f"Error loading data: {e}")
            return None