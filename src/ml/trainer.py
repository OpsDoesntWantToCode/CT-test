import pandas as pd
import xgboost as xgb
import joblib
import os
import numpy as np

class SafetyModelTrainer:
    def __init__(self, data_path="data/vietnam_weather_disaster_data.csv", model_path="data/models/xgboost_safety.json"):
        self.data_path = data_path
        self.model_path = model_path
        self.features = [
            'lat', 'lon', 'temperature', 'humidity', 'pressure', 
            'wind_speed', 'precip6', 'precip24', 'gust6', 
            'river_discharge', 'eq_mag', 'eq_dist'
        ]
        self.target = 'safety_score'

    def generate_strict_score(self, row):
        """
        Hàm chấm điểm KHẮT KHE (Strict Mode)
        """
        score = 100.0
        
        # 1. Phạt Gió (Wind) - Phạt nặng theo cấp số nhân
        # Gió > 10m/s (Cấp 5) bắt đầu trừ
        if row['wind_speed'] > 10:
            # Hệ số phạt tăng lên 3.0 (Cũ là 2.0)
            score -= (row['wind_speed'] - 10) * 3.0
        
        # Gió giật > 15m/s
        if row['gust6'] > 15:
             score -= (row['gust6'] - 15) * 1.5

        # 2. Phạt Mưa (Rain)
        if row['precip24'] > 50:
            score -= (row['precip24'] - 50) * 0.5
        
        # Mưa thảm họa (> 200mm) trừ thẳng 40 điểm
        if row['precip24'] > 200: 
            score -= 40 

        # 3. Phạt Áp suất thấp (Dấu hiệu bão tâm bão)
        if 850 < row['pressure'] < 990:
            score -= (1000 - row['pressure']) * 1.5

        # 4. Phạt Lũ & Động đất
        if row['river_discharge'] > 1000:
            score -= 30
        
        if row['eq_mag'] > 4.5 and row['eq_dist'] < 100:
            score -= 80 # Động đất mạnh là về gần 0 ngay

        return max(0.0, min(100.0, score))

    def add_synthetic_disasters(self, df):
        """
        TẠO DỮ LIỆU GIẢ LẬP: Bão, Lũ, Động đất
        Để dạy mô hình biết thế nào là thảm họa.
        """
        print("⚡ Đang tạo thêm 600 mẫu dữ liệu thảm họa giả lập (Data Augmentation)...")
        
        synthetic_data = []
        
        # 1. Tạo 200 mẫu Bão lớn (Typhoon)
        # Đặc điểm: Gió cực mạnh, áp suất thấp, mưa to
        for _ in range(200):
            sample = {
                'location': 'Synthetic Typhoon',
                'lat': np.random.uniform(10, 23),
                'lon': np.random.uniform(102, 109),
                'temperature': np.random.uniform(22, 26),
                'humidity': np.random.uniform(95, 100),
                'pressure': np.random.uniform(950, 990), # Áp thấp
                'wind_speed': np.random.uniform(20, 50), # Gió cấp 9 - cấp 15
                'precip6': np.random.uniform(50, 150),
                'precip24': np.random.uniform(150, 400), # Mưa xối xả
                'gust6': np.random.uniform(30, 60),
                'river_discharge': 500,
                'eq_mag': -1, 'eq_dist': -1
            }
            synthetic_data.append(sample)

        # 2. Tạo 200 mẫu Lũ lụt (Flood)
        # Đặc điểm: Mưa dai dẳng, lưu lượng sông cao
        for _ in range(200):
            sample = {
                'location': 'Synthetic Flood',
                'lat': np.random.uniform(10, 23),
                'lon': np.random.uniform(102, 109),
                'temperature': np.random.uniform(25, 30),
                'humidity': np.random.uniform(90, 100),
                'pressure': 1005,
                'wind_speed': np.random.uniform(5, 12),
                'precip6': np.random.uniform(20, 50),
                'precip24': np.random.uniform(100, 250),
                'gust6': 15,
                'river_discharge': np.random.uniform(1500, 5000), # Lũ
                'eq_mag': -1, 'eq_dist': -1
            }
            synthetic_data.append(sample)

        # 3. Tạo 200 mẫu Động đất (Earthquake)
        for _ in range(200):
            sample = {
                'location': 'Synthetic Earthquake',
                'lat': 15.0, 'lon': 108.0,
                'temperature': 28, 'humidity': 70, 'pressure': 1012,
                'wind_speed': 5, 'precip6': 0, 'precip24': 0, 'gust6': 5,
                'river_discharge': 100,
                'eq_mag': np.random.uniform(5.0, 8.0), # Rung chấn mạnh
                'eq_dist': np.random.uniform(5, 80)    # Tâm chấn gần
            }
            synthetic_data.append(sample)

        synthetic_df = pd.DataFrame(synthetic_data)
        
        # Gộp vào dữ liệu gốc
        return pd.concat([df, synthetic_df], ignore_index=True)

    def train(self):
        print(f"--- BẮT ĐẦU HUẤN LUYỆN (CHẾ ĐỘ KHẮT KHE) ---")
        
        if not os.path.exists(self.data_path):
            print(f"LỖI: Không tìm thấy file {self.data_path}")
            return

        df = pd.read_csv(self.data_path)
        df.columns = df.columns.str.strip()
        df = df.fillna(-1)

        # --- BƯỚC 1: Bơm thêm dữ liệu thảm họa ---
        df = self.add_synthetic_disasters(df)

        # --- BƯỚC 2: Tính điểm lại với logic khắt khe ---
        print("Đang chấm điểm lại toàn bộ dữ liệu (bao gồm dữ liệu giả lập)...")
        df[self.target] = df.apply(self.generate_strict_score, axis=1)

        # Debug: Xem thử dữ liệu bão có điểm thấp chưa
        storm_samples = df[df['wind_speed'] > 30].head(3)
        print("\n--- Kiểm tra mẫu Bão lớn (Kỳ vọng điểm < 30) ---")
        if not storm_samples.empty:
            print(storm_samples[[self.target, 'wind_speed', 'precip24']])
        else:
            print("Chưa thấy mẫu bão lớn nào (Lỗi logic tạo dữ liệu).")

        X = df[self.features]
        y = df[self.target]

        # Cấu hình XGBoost sâu hơn để học tốt hơn
        model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=300,    # Tăng số vòng lặp học
            learning_rate=0.05,
            max_depth=7,         # Tăng độ sâu cây
            random_state=42
        )

        print(f"\nĐang huấn luyện trên tổng {len(df)} dòng dữ liệu...")
        model.fit(X, y)

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        model.save_model(self.model_path)
        joblib.dump(self.features, "data/models/features_list.pkl")
        
        print(f"🎉 Đã lưu mô hình mới. BẮT BUỘC khởi động lại API để cập nhật!")

if __name__ == "__main__":
    trainer = SafetyModelTrainer(data_path="data/vietnam_weather_disaster_data.csv")
    trainer.train()