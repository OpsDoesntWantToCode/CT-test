# app/routers/sos.py
from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from typing import Optional
from datetime import datetime
import uuid
import json
import os

# Import các module từ repo của bạn
from app.core.rescue_finder import rescue_finder 
from app.core.notification import send_sos_email
from app.schemas.sos import SOSRequest, SOSResponse, LocationUpdate 
from app.core.socket_manager import manager # Import manager vừa tạo

router = APIRouter()

# --- Database Mock (Giữ nguyên logic của bạn) ---
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

def update_alert_location(alert_id, lat, long, battery):
    """Hàm cập nhật vị trí mới nhất vào DB"""
    db = load_alerts()
    if alert_id in db:
        db[alert_id]["location"] = {"lat": lat, "long": long}
        db[alert_id]["battery_level"] = battery
        db[alert_id]["last_updated"] = datetime.now()
        with open(DB_FILE, "w") as f:
            json.dump(db, f, indent=4, default=str)

# --- Background Task ---
def process_emergency_logic(alert_id: str, data: SOSRequest):
    """Tìm trạm & Gửi mail"""
    # 1. Tìm trạm cứu hộ
    nearest = rescue_finder.find_nearest_station(data.latitude, data.longitude)
    
    status_msg = "Dispatched" if nearest else "Pending"
    
    # 2. Gửi Email
    location = {"lat": data.latitude, "long": data.longitude}
    email_sent = send_sos_email(data.user_email, location, data.medical_info, nearest)

    # 3. Lưu DB ban đầu
    alert_data = {
        "created_at": datetime.now(),
        "user_id": data.user_id,
        "location": location,
        "status": status_msg,
        "responder": nearest,
        "medical_info": data.medical_info,
        "email_notified": email_sent,
        "history": [] # Lưu lịch sử di chuyển
    }
    save_alert(alert_id, alert_data)

# --- API ENDPOINTS ---

@router.post("/activate", response_model=SOSResponse)
async def activate_sos(data: SOSRequest, background_tasks: BackgroundTasks):
    """
    Bước 1: User gọi API này khi nhấn nút SOS.
    Trả về alert_id để sau đó User dùng kết nối WebSocket.
    """
    alert_id = str(uuid.uuid4())
    
    nearest_station = rescue_finder.find_nearest_station(data.latitude, data.longitude)
    
    background_tasks.add_task(process_emergency_logic, alert_id, data)

    message = "Đã gửi tín hiệu SOS!"
    if nearest_station:
        message = f"Đơn vị {nearest_station['Name']} đang được điều động."

    return SOSResponse(
        alert_id=alert_id,
        status="PROCESSING",
        message=message,
        nearest_station=nearest_station
    )

@router.websocket("/ws/{alert_id}")
async def websocket_sos_tracking(websocket: WebSocket, alert_id: str):
    """
    Bước 2: Real-time Tracking (Use Case 4.6 & Continuous Sharing)
    Frontend gọi: ws://domain/api/v1/sos/ws/{alert_id}
    """
    await manager.connect(websocket, alert_id)
    try:
        while True:
            # Nhận dữ liệu vị trí liên tục từ User App
            data = await websocket.receive_json()
            
            # Giả sử client gửi lên JSON: {"lat": 10.7, "long": 106.6, "battery": 80}
            lat = data.get("lat")
            long = data.get("long")
            battery = data.get("battery")
            
            # 1. Cập nhật vào DB (để lưu vết)
            update_alert_location(alert_id, lat, long, battery)
            
            # 2. Broadcast cho Dashboard cứu hộ (nếu họ đang xem alert này)
            # Giả lập phản hồi từ server: Tính lại khoảng cách tới trạm
            # (Trong thực tế đoạn này phức tạp hơn)
            response_msg = {
                "type": "tracking_update",
                "user_location": {"lat": lat, "long": long},
                "server_time": str(datetime.now())
            }
            
            await manager.broadcast(response_msg, alert_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, alert_id)
        # Có thể thêm logic: Nếu mất kết nối > 5 phút -> Báo động đỏ