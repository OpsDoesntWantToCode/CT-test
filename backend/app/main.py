import sys
import os

# --- CHÈN ĐOẠN NÀY VÀO DÒNG ĐẦU TIÊN CỦA FILE ---
# Giúp Python nhìn thấy thư mục gốc 'Project 5.1 - Backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# ------------------------------------------------
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import các router con
from app.routers import map_risk, ai_score

# Khởi tạo App
app = FastAPI(
    title="Travel Safety Integrated System",
    description="Backend hợp nhất GIS (Bản đồ) và AI (Dự đoán an toàn)",
    version="2.0.0"
)

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

# 2. Router AI -> /api/v1/ai/...
app.include_router(ai_score.router, prefix="/api/v1/ai", tags=["AI Prediction"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Travel Safety Backend is Running 🚀"}

# Đoạn này để chạy file trực tiếp bằng python app/main.py (nếu muốn)
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)