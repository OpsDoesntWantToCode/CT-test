from fastapi import APIRouter, HTTPException
from src.schemas.safety_schema import SafetyInput, SafetyOutput
from src.ml.predictor import SafetyPredictor

router = APIRouter()
predictor = SafetyPredictor()

@router.post("/predict", response_model=SafetyOutput)
async def predict_safety(data: SafetyInput):
    try:
        # Gọi hàm dự đoán (truyền toàn bộ object data vào)
        score = predictor.predict_score(data)

        # Phân loại rủi ro dựa trên điểm số
        risk_level = "Info"
        if score < 25: 
            risk_level = "High"
        elif score < 50: 
            risk_level = "Medium"
        elif score < 80: 
            risk_level = "Low"

        # Tạo chuỗi chi tiết từ các nhãn đầu vào
        detail_msg = (
            f"Loc: {data.location}. "
            f"Overall Hazard: {data.overall_hazard_prediction}. "
            f"Rain: {data.precip24}mm, Wind Gust: {data.gust6}."
        )

        return SafetyOutput(
            safety_score=round(score),
            risk_level=risk_level,
            details=detail_msg
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")