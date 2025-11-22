from fastapi import APIRouter, HTTPException
from src.schemas.safety_schema import SafetyInput, SafetyOutput
from src.ml.predictor import SafetyPredictor
from datetime import datetime

# --- KHỞI TẠO ROUTER (DÒNG BẠN ĐANG THIẾU) ---
router = APIRouter()
# ---------------------------------------------

# Khởi tạo bộ dự đoán (Load model 1 lần duy nhất khi chạy server)
predictor = SafetyPredictor()

@router.post("/predict", response_model=SafetyOutput)
async def predict_safety(data: SafetyInput):
    try:
        # Lấy tháng hiện tại
        month = datetime.now().month
        
        # Gom nhóm thông tin thời tiết để truyền vào logic
        weather_ctx = {
            'rain_prob': data.rain_probability,
            'wind_speed': data.wind_speed,
            'storm_prob': data.storm_probability
        }

        # Gọi hàm dự đoán từ Predictor
        score = predictor.predict_score(
            lat=data.lat,
            lon=data.lon,
            month=month,
            weather_context=weather_ctx,
            risk_polygon=data.risk_polygon # Truyền trực tiếp object Polygon
        )

        # Phân loại rủi ro dựa trên điểm số
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
            details=f"Prediction for {data.city} at ({data.lat}, {data.lon})"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")