# src/api/endpoints.py
from fastapi import APIRouter, HTTPException
from src.schemas.safety_schema import SafetyInput, SafetyOutput
from src.ml.predictor import SafetyPredictor

router = APIRouter()

# Khởi tạo predictor (Singleton)
predictor = SafetyPredictor()

@router.post("/safety-score", response_model=SafetyOutput)
async def calculate_safety_score(data: SafetyInput):
    try:
        # 1. Tính điểm an toàn từ mô hình
        score = predictor.predict_risk(data)
        
        # 2. Xác định mức độ rủi ro
        risk_level = predictor.get_risk_level(score)
        
        # 3. Tạo gợi ý đơn giản
        suggestion = "An toàn." if risk_level in ["Info", "Low"] else "Cần đề phòng thiên tai."

        return SafetyOutput(
            location=data.location,
            safety_score=round(score, 2),
            risk_level=risk_level,
            suggestion=suggestion
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))