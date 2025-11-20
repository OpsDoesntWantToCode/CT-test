import pandas as pd
import xgboost as xgb
from src.processing.data_cleaner import DataCleaner
from src.processing.gis_processor import GisProcessor
from src.config import MODEL_PATH, MODEL_PARAMS
import os

def train_model():
    print("1. Dang doc du lieu History...")
    cleaner = DataCleaner()
    df = cleaner.load_data()
    
    if df is None or df.empty:
        print("Khong co du lieu de train.")
        return

    print("2. Dang trich xuat du lieu GIS (Land Cover)...")
    gis = GisProcessor()
    # Áp dụng cho từng dòng để lấy land cover code
    # Lưu ý: Data lớn thì bước này sẽ lâu
    df['land_cover'] = df.apply(lambda x: gis.get_land_cover(x['Latitude'], x['Longitude']), axis=1)
    
    print("3. Chuan bi Feature va Target...")
    # Features: Lat, Lon, Month, Land Cover
    X = df[['Latitude', 'Longitude', 'Start Month', 'land_cover']]
    y = df['target']
    
    print("4. Training XGBoost...")
    model = xgb.XGBRegressor(**MODEL_PARAMS)
    model.fit(X, y)
    
    # Tạo thư mục nếu chưa có
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # Lưu model
    model.save_model(MODEL_PATH)
    print(f"5. Model da duoc luu tai: {MODEL_PATH}")

if __name__ == "__main__":
    train_model()