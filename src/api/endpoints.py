from fastapi import APIRouter, HTTPException
from src.schemas.safety_schema import SafetyInput, SafetyOutput
from src.ml.predictor import SafetyPredictor
from datetime import datetime

router = APIRouter()
predictor = SafetyPredictor()

@router.post("/predict", response_model=SafetyOutput)
async def predict_safety(data: SafetyInput):
    try:
        # Lấy tháng hiện tại từ timestamp hoặc mặc định là tháng này
        if data.timestamp:
            # Xử lý chuỗi thời gian nếu cần
            month = datetime.now().month 
        else:
            month = datetime.now().month

        # Context cho việc điều chỉnh điểm số
        weather_ctx = {
            'storm_prob': data.storm_probability,
            'rain_prob': data.rain_probability,
            'wind_speed': data.wind_speed
        }

        # Thực hiện dự đoán
        score = predictor.predict_score(
            lat=data.lat,
            lon=data.lon,
            month=month,
            weather_context=weather_ctx
        )

        # Xác định Risk Level
        risk_level = "Info"
        if score < 25:
            risk_level = "High"
        elif score < 50:
            risk_level = "Medium"
        elif score < 80:
            risk_level = "Low"

        return SafetyOutput(
            safety_score=round(score, 2),
            risk_level=risk_level,
            details=f"Prediction based on historical data at ({data.lat}, {data.lon}) and current weather."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))