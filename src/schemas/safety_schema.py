from pydantic import BaseModel
from typing import Optional, List, Literal

# Định nghĩa cấu trúc con cho risk_polygon
class RiskGeometry(BaseModel):
    type: Literal["Polygon"]
    coordinates: List[List[List[float]]]

class SafetyInput(BaseModel):
    # 1. Thông tin cơ bản
    city: str
    lat: float
    lon: float
    
    # 2. Thông tin thời tiết
    temperature_C: float
    humidity: float
    pressure: float
    wind_speed: float
    weather_description: str
    rain_probability: float
    storm_probability: float
    
    # 3. Thông tin cảnh báo (Alert)
    alert_event: Optional[str] = None
    alert_description: Optional[str] = None
    alert_start: Optional[str] = None
    alert_end: Optional[str] = None
    
    # 4. Động đất
    earthquake_mag: Optional[float] = 0
    earthquake_place: Optional[str] = None
    
    # 5. Hỏa hoạn
    fire_count: Optional[int] = 0
    fire_confidence_max: Optional[float] = 0
    
    # 6. Thời gian
    timestamp: Optional[str] = None
    
    # 7. Vùng rủi ro (Chỉ có type và coordinates)
    risk_polygon: Optional[RiskGeometry] = None

class SafetyOutput(BaseModel):
    safety_score: float
    risk_level: str
    details: str