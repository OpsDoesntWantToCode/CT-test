# app/routers/sos.py
from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

# Import các module nội bộ
from app.core.rescue_finder import rescue_finder 
from app.core.notification import send_sos_email
from app.schemas.sos import SOSRequest, SOSResponse
from app.core.socket_manager import manager 

# Import Database PostgreSQL
from app.core.database import get_db, engine
from app.models import sos_model

# Tạo bảng tự động nếu chưa có (trong thực tế nên dùng Alembic để migrate)
sos_model.Base.metadata.create_all(bind=engine)

router = APIRouter()

# --- Helper Functions (Database Logic) ---

def create_alert_pg(db: Session, alert_id: str, data: SOSRequest, nearest: dict, status: str, email_sent: bool):
    """Lưu alert mới vào PostgreSQL"""
    new_alert = sos_model.SOSAlert(
        alert_id=alert_id,
        user_id=data.user_id,
        lat=data.latitude,
        long=data.longitude,
        status=status,
        responder=nearest, # Postgres tự động convert dict sang JSON
        medical_info=data.medical_info,
        email_notified=email_sent,
        history=[] 
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

def update_location_pg(db: Session, alert_id: str, lat: float, long: float, battery: int):
    """Cập nhật vị trí và append lịch sử"""
    alert = db.query(sos_model.SOSAlert).filter(sos_model.SOSAlert.alert_id == alert_id).first()
    
    if alert:
        # Cập nhật thông tin mới nhất
        alert.lat = lat
        alert.long = long
        alert.battery_level = battery
        
        # Cập nhật lịch sử (append vào mảng JSON)
        # Lưu ý: Với SQLAlchemy ORM, cần gán lại list mới để nó nhận biết thay đổi
        current_history = list(alert.history) if alert.history else []
        current_history.append({
            "lat": lat, 
            "long": long, 
            "battery": battery,
            "time": str(datetime.now())
        })
        alert.history = current_history
        
        db.commit()

# --- API ENDPOINTS ---

@router.post("/activate", response_model=SOSResponse)
async def activate_sos(
    data: SOSRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db) # Inject Postgres Session
):
    alert_id = str(uuid.uuid4())
    
    # 1. Tìm trạm cứu hộ (Logic cũ)
    nearest_station = rescue_finder.find_nearest_station(data.latitude, data.longitude)
    status_msg = "Dispatched" if nearest_station else "Pending"
    
    # 2. Gửi Email (Background Task)
    location = {"lat": data.latitude, "long": data.longitude}
    background_tasks.add_task(
        send_sos_email, 
        data.user_email, location, data.medical_info, nearest_station
    )

    # 3. Lưu vào PostgreSQL
    try:
        create_alert_pg(db, alert_id, data, nearest_station, status_msg, False)
    except Exception as e:
        # Nếu lỗi DB thì vẫn nên trả về success cho user nhưng log lại lỗi
        print(f"❌ DB Error: {e}")
        
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
async def websocket_sos_tracking(
    websocket: WebSocket, 
    alert_id: str,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, alert_id)
    try:
        while True:
            # Nhận dữ liệu từ App User
            data = await websocket.receive_json()
            
            lat = data.get("lat")
            long = data.get("long")
            battery = data.get("battery")
            
            # 1. Cập nhật PostgreSQL
            # (Có thể tối ưu bằng cách chỉ update mỗi 5s một lần thay vì real-time từng gói tin)
            update_location_pg(db, alert_id, lat, long, battery)
            
            # 2. Broadcast cho Dashboard
            response_msg = {
                "type": "tracking_update",
                "user_location": {"lat": lat, "long": long},
                "battery": battery,
                "server_time": str(datetime.now())
            }
            await manager.broadcast(response_msg, alert_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, alert_id)