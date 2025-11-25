from pydantic import BaseModel
from typing import Optional, Any, Dict

class SafetyInput(BaseModel):
    # 1. Định danh & Vị trí
    location: str
    lat: float
    lon: float
    
    # 2. Thời tiết cơ bản
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    
    # 3. Chỉ số chi tiết (Mưa/Gió/Lũ)
    precip6: float        # Lượng mưa 6h
    precip24: float       # Lượng mưa 24h
    gust6: float          # Gió giật 6h
    river_discharge: float # Lưu lượng dòng chảy sông
    
    # 4. Động đất
    eq_mag: float         # Độ lớn động đất
    eq_dist: float        # Khoảng cách đến tâm chấn
    
    # 5. Các nhãn phân loại (Labels - Có thể là kết quả từ model khác)
    rain_label: str
    wind_label: str
    storm_label: str
    flood_label: str
    earthquake_label: str
    
    # 6. Dự báo tổng quan & GIS
    overall_hazard_prediction: str  # Dự đoán rủi ro tổng thể
    giscontent: Optional[Dict[str, Any]] = None # Thông tin GIS (dạng JSON object)

class SafetyOutput(BaseModel):
    safety_score: int
    risk_level: str
    details: str