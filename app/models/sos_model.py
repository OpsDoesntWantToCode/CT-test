# app/models/sos_model.py
from sqlalchemy import Column, String, Float, DateTime, Boolean, Integer
# Sử dụng kiểu JSON của Postgres để hiệu năng tốt hơn
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from app.core.database import Base

class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    alert_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Vị trí hiện tại
    lat = Column(Float)
    long = Column(Float)
    battery_level = Column(Integer, nullable=True)
    
    # Trạng thái & Thông tin
    status = Column(String)
    
    # PostgreSQL lưu JSON trực tiếp, cho phép query sâu bên trong nếu cần
    responder = Column(JSON, nullable=True) 
    medical_info = Column(String, nullable=True)
    
    email_notified = Column(Boolean, default=False)
    
    # Lưu lịch sử di chuyển
    history = Column(JSON, default=list)