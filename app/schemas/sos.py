# app/schemas/sos.py
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

# --- HTTP Request/Response (Giữ nguyên hoặc cập nhật nhẹ) ---
class SOSRequest(BaseModel):
    latitude: float
    longitude: float
    user_id: str
    user_email: Optional[str] = "nguoinha@example.com"
    medical_info: Optional[str] = "Không có"
    risk_context: Optional[str] = "Khẩn cấp"
    # Thêm trường này để biết nguồn kích hoạt (Button/Voice/Shake)
    activation_method: str = "button" 

class SOSResponse(BaseModel):
    alert_id: str
    status: str
    message: str
    nearest_station: Optional[dict] = None

# --- WebSocket Schemas (Mới) ---
class LocationUpdate(BaseModel):
    """Dữ liệu user gửi lên liên tục qua Socket"""
    latitude: float
    longitude: float
    battery_level: Optional[int] = None
    timestamp: datetime = datetime.now()

class WebSocketMessage(BaseModel):
    """Cấu trúc tin nhắn server gửi về cho App (User)"""
    type: str # 'update_status', 'rescuer_location', 'chat'
    content: Dict