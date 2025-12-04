from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import json
import os

# Import các module thật của bạn
from app.core.rescue_finder import rescue_finder  # Import instance từ file bạn đã upload
from app.core.notification import send_sos_email  # Import hàm gửi mail vừa tạo

router = APIRouter()

# --- Database giả lập bằng File JSON (Persistent Storage) ---
DB_FILE = "alerts_db.json"

def load_alerts():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_alert(alert_id, data):
    db = load_alerts()
    db[alert_id] = data
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4, default=str)

# --- Schemas ---
class SOSRequest(BaseModel):
    latitude: float
    longitude: float
    user_id: str
    user_email: Optional[str] = "nguoinha@example.com" # Email nhận cảnh báo
    medical_info: Optional[str] = "Không có"
    risk_context: Optional[str] = "Khẩn cấp"

class SOSResponse(BaseModel):
    alert_id: str
    status: str
    message: str
    nearest_station: Optional[dict] = None

# --- Logic Xử lý ---

def process_emergency_logic(alert_id: str, data: SOSRequest):
    """Hàm chạy ngầm: Tìm trạm, Gửi mail, Cập nhật DB"""
    
    # 1. Tìm trạm cứu hộ gần nhất THẬT từ CSV
    # rescue_finder đã được load sẵn dữ liệu từ Vietnam_Rescue.csv
    nearest = rescue_finder.find_nearest_station(data.latitude, data.longitude)
    
    status_msg = "Dispatching"
    responder_info = None

    if nearest:
        responder_info = nearest
        print(f"🚑 [DISPATCH] Điều phối đơn vị: {nearest['Name']} - Cách {nearest['distance_km']}km")
        status_msg = "Dispatched"
    else:
        print("⚠️ [DISPATCH] Không tìm thấy trạm cứu hộ trong dữ liệu CSV!")
        status_msg = "Pending - No Station Found"

    # 2. Gửi Email THẬT
    location = {"lat": data.latitude, "long": data.longitude}
    email_sent = send_sos_email(data.user_email, location, data.medical_info, nearest)

    # 3. Cập nhật trạng thái vào 'Database' JSON
    alert_data = {
        "created_at": datetime.now(),
        "user_id": data.user_id,
        "location": location,
        "status": status_msg,
        "responder": responder_info,
        "medical_info": data.medical_info,
        "email_notified": email_sent
    }
    save_alert(alert_id, alert_data)


@router.post("/activate", response_model=SOSResponse)
async def activate_sos(data: SOSRequest, background_tasks: BackgroundTasks):
    # 1. Tạo ID định danh
    alert_id = str(uuid.uuid4())
    
    # 2. Tìm nhanh trạm cứu hộ (để trả về ngay cho UI hiển thị)
    # Sử dụng logic thực tế từ RescueFinder
    nearest_station = rescue_finder.find_nearest_station(data.latitude, data.longitude)
    
    # 3. Đẩy việc gửi mail và lưu DB vào background để API phản hồi nhanh
    background_tasks.add_task(process_emergency_logic, alert_id, data)

    message = "Đã nhận tín hiệu SOS."
    if nearest_station:
        message = f"Đã tìm thấy đơn vị {nearest_station['Name']} cách {nearest_station['distance_km']}km."

    return SOSResponse(
        alert_id=alert_id,
        status="PROCESSING",
        message=message,
        nearest_station=nearest_station
    )

@router.get("/status/{alert_id}")
async def get_alert_status(alert_id: str):
    """API để Frontend polling cập nhật trạng thái cứu hộ (Use Case 4.6)"""
    db = load_alerts()
    if alert_id not in db:
        raise HTTPException(status_code=404, detail="Alert not found")
    return db[alert_id]