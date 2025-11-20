from pydantic import BaseModel
from typing import Optional

class SafetyInput(BaseModel):
    city: str
    lat: float
    lon: float
    
    # Thông tin thời tiết
    temperature_C: float
    humidity: float
    pressure: float
    wind_speed: float
    weather_description: str
    rain_probability: float
    storm_probability: float
    
    # Cảnh báo & Sự kiện
    alert_event: Optional[str] = None
    alert_description: Optional[str] = None
    alert_start: Optional[str] = None
    alert_end: Optional[str] = None
    
    # Động đất & Hỏa hoạn
    earthquake_mag: Optional[float] = 0
    earthquake_place: Optional[str] = None
    fire_count: Optional[int] = 0
    fire_confidence_max: Optional[float] = 0
    
    # Context
    timestamp: Optional[str] = None
    gis_context: Optional[dict] = {}

class SafetyOutput(BaseModel):
    safety_score: float
    risk_level: str  # Info, Low, Medium, High
    details: str