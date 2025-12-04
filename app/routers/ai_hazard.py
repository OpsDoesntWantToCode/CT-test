from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.ml.predictor_hazard import HazardPredictor

router = APIRouter()
model = HazardPredictor()

# --- Pydantic Models ---
class HazardInput(BaseModel):
    """Input schema cho hazard prediction - lấy từ normalized_data.csv"""
    # Vị trí
    location: Optional[str] = "Unknown"
    lat: Optional[float] = 0.0
    lon: Optional[float] = 0.0
    
    # Thời tiết cơ bản
    temperature: Optional[float] = 30.0
    humidity: Optional[float] = 70.0
    pressure: Optional[float] = 1013.0
    wind_speed: Optional[float] = 5.0
    
    # Thời tiết nâng cao (Mưa, Gió giật)
    precip6: Optional[float] = 0.0
    precip24: Optional[float] = 0.0
    gust6: Optional[float] = 0.0
    
    # Thảm họa (Thủy văn, Động đất)
    river_discharge: Optional[float] = -1.0
    eq_mag: Optional[float] = -1.0
    eq_dist: Optional[float] = -1.0
    
    # Nhãn dự đoán (từ CSV)
    rain_label: Optional[str] = "low"
    wind_label: Optional[str] = "low"
    storm_label: Optional[str] = "low"
    flood_label: Optional[str] = "no"
    earthquake_label: Optional[str] = "no"

class HazardResponse(BaseModel):
    """Response schema cho hazard prediction"""
    overall_hazard: str
    confidence: str = "High"

# --- Endpoints ---
@router.post("/predict", response_model=HazardResponse)
async def predict_hazard(input_data: HazardInput):
    """
    Dự đoán loại thảm họa từ dữ liệu thời tiết và địa chất.
    
    Args:
        input_data: HazardInput object chứa các thông số thời tiết
        
    Returns:
        HazardResponse với overall_hazard (No, Rain, Storm, Wind, Flood)
    """
    try:
        # Chuyển Pydantic model thành dict
        data_dict = input_data.dict()
        hazard = model.predict_overall_hazard(data_dict)
        
        return HazardResponse(overall_hazard=hazard, confidence="High")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
