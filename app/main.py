import sys
import os
from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from typing import Optional

# --- Cấu hình đường dẫn ---
# Giúp Python nhìn thấy thư mục gốc 'backend' để import module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Import các router ---
# LƯU Ý: Phải đảm bảo tất cả các file này đều tồn tại trong thư mục app/routers/
from app.routers import (
    map_risk, 
    ai_score, 
    login_register, 
    ai_hazard, 
    rescue, 
    live_data, # <--- [QUAN TRỌNG] Thêm cái này
    system,     # <--- [QUAN TRỌNG] Đảm bảo đã tạo file system.py
    sos
)

# --- Các Class Model (Có thể giữ lại hoặc chuyển sang schemas.py) ---
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    user: Optional[dict] = None

# --- Khởi tạo App ---
app = FastAPI(
    title="Travel Safety Integrated System",
    description="Backend hợp nhất GIS (Bản đồ), AI (Dự báo) và Live Data",
    version="2.0.0"
)

app.add_middleware(SessionMiddleware, secret_key="your-secret-key-change-in-production")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Đăng ký Router (Gắn API vào App) ---

# 1. Router Bản đồ -> /api/v1/map/...
app.include_router(map_risk.router, prefix="/api/v1/map", tags=["Map & GIS"])

# 2. Router AI Safety Score -> /api/v1/ai/...
app.include_router(ai_score.router, prefix="/api/v1/ai", tags=["AI Safety Prediction"])

# 3. Router AI Hazard Prediction -> /api/v1/hazard/...
app.include_router(ai_hazard.router, prefix="/api/v1/hazard", tags=["AI Hazard Prediction"])

# 4. Router Authentication -> /api/auth/...
app.include_router(login_register.router, prefix="/api/auth", tags=["Authentication"])

# 5. Router Cứu hộ -> /api/v1/rescue/...
app.include_router(rescue.router, prefix="/api/v1/rescue", tags=["Rescue Finder"])

# 6. Router Live Data (Thời tiết thật + Cảnh báo) -> /api/v1/live/... 
# [QUAN TRỌNG] Cái này cần cho trang Home
app.include_router(live_data.router, prefix="/api/v1/live", tags=["Live Data"])

# 7. Router System (Trigger xử lý dữ liệu) -> /api/v1/system/...
# Dùng để Data Collector gọi sau khi thu thập xong
app.include_router(system.router, prefix="/api/v1/system", tags=["System Operations"])

# 8. Router SOS System -> /api/sos/...
# Dùng để App di động gọi khi người dùng bấm nút SOS
app.include_router(sos.router, prefix="/api/sos", tags=["SOS System"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Travel Safety Backend is Running 🚀"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)