# backend/app/schemas/sos.py (Tạo mới)
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SOSRequest(BaseModel):
    latitude: float
    longitude: float
    user_id: str
    medical_info: Optional[str] = None
    risk_context: Optional[str] = "Normal"
    timestamp: datetime = datetime.now()
    activation_method: str  # "button", "voice", "shake", "fall_detection"

class SOSResponse(BaseModel):
    alert_id: str
    status: str
    message: str
    estimated_responder_arrival: Optional[int] = None # minutes