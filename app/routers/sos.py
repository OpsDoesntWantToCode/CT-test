# app/routers/sos.py

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.ml.schemas import SOSRequest
from app.core.rescue_finder import find_nearest_rescue_facilities # Giả sử tên hàm là này
import pandas as pd
from datetime import datetime
import os

router = APIRouter()

# File để lưu log lịch sử SOS (thay vì DB SQL phức tạp lúc này)
SOS_LOG_FILE = "data/sos_logs.csv"

def log_incident_to_csv(data: dict):
    """Ghi lại vụ việc vào CSV để tra soát sau này"""
    df = pd.DataFrame([data])
    if not os.path.isfile(SOS_LOG_FILE):
        df.to_csv(SOS_LOG_FILE, index=False)
    else:
        df.to_csv(SOS_LOG_FILE, mode='a', header=False, index=False)

@router.post("/trigger")
async def trigger_sos(request: SOSRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Tìm đội cứu hộ gần nhất (Dùng logic có sẵn của bạn)
        # Giả sử load data từ file Vietnam_Rescue.csv trong memory hoặc đọc lại
        # rescue_station = find_nearest_rescue(request.latitude, request.longitude)
        
        # MOCKUP: Giả lập tìm thấy trạm (nếu chưa tích hợp xong rescue_finder)
        rescue_station = {
            "name": "Công an Phường X",
            "distance_km": 1.2,
            "phone": "0283xxxxxxx"
        }

        # 2. Đóng gói thông tin vụ việc
        incident_data = {
            "timestamp": datetime.now().isoformat(),
            "user_id": request.user_id,
            "lat": request.latitude,
            "long": request.longitude,
            "medical_info": request.medical_notes or "Không có",
            "contact_person": request.contact_phone or "Không có",
            "dispatched_to": rescue_station['name']
        }

        # 3. Ghi log (Chạy ngầm để API phản hồi nhanh)
        background_tasks.add_task(log_incident_to_csv, incident_data)

        # 4. Phản hồi cho App
        return {
            "status": "SOS_DISPATCHED",
            "message": "Đã gửi tín hiệu cứu hộ thành công!",
            "nearest_rescue": rescue_station, # Trả về để App hiển thị/chỉ đường tới đó
            "instruction": "Giữ nguyên vị trí hoặc di chuyển theo bản đồ."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))