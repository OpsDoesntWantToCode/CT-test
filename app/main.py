import sys
import os
from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from typing import Optional


# --- CHÈN ĐOẠN NÀY VÀO DÒNG ĐẦU TIÊN CỦA FILE ---
# Giúp Python nhìn thấy thư mục gốc 'Project 5.1 - Backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# ------------------------------------------------

# Import các router con
from app.routers import map_risk, ai_score, login_register, ai_hazard, rescue, sos

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

# Khởi tạo App
app = FastAPI(
    title="Travel Safety Integrated System",
    description="Backend hợp nhất GIS (Bản đồ) và AI (Dự đoán an toàn)",
    version="2.0.0"
)

app.add_middleware(SessionMiddleware, secret_key="your-secret-key-change-in-production")


# Cấu hình CORS (Cho phép Frontend gọi API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong production nên đổi thành domain cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn Router vào App
# 1. Router Bản đồ -> /api/v1/map/...
app.include_router(map_risk.router, prefix="/api/v1/map", tags=["Map & GIS"])

# 2. Router AI Safety Score -> /api/v1/ai/...
app.include_router(ai_score.router, prefix="/api/v1/ai", tags=["AI Safety Prediction"])

# 3. Router AI Hazard Prediction -> /api/v1/hazard/...
app.include_router(ai_hazard.router, prefix="/api/v1/hazard", tags=["AI Hazard Prediction"])

# 4. Router Đăng nhập/Đăng ký -> /api/auth/...
app.include_router(login_register.router, prefix="/api/auth", tags=["Authentication"])
# 5. Router Tìm trạm cứu hộ -> /api/v1/rescue/...
app.include_router(rescue.router, prefix="/api/v1/rescue", tags=["Rescue Finder"])
# 6. Router SOS Khẩn cấp -> /api/sos/...
app.include_router(sos.router, prefix="/api/v1/sos", tags=["SOS Real System"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Travel Safety Backend is Running 🚀"}


# Đoạn này để chạy file trực tiếp bằng python app/main.py (nếu muốn)
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
    