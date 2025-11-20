from fastapi import FastAPI
from src.api import endpoints
import uvicorn

app = FastAPI(
    title="Vietnam Safety Score System",
    description="API dự đoán điểm an toàn dựa trên dữ liệu thiên tai lịch sử và GIS.",
    version="1.0.0"
)

# Include Router
app.include_router(endpoints.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Safety Score API is running. Go to /docs for API testing."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)