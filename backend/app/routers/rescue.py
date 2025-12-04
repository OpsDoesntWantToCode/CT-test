from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.rescue_finder import rescue_finder # Import logic từ bước 1

router = APIRouter(
    tags=["Rescue"],
    responses={404: {"description": "Not found"}},
)

# Định nghĩa dữ liệu đầu vào
class UserLocation(BaseModel):
    lat: float
    lon: float
    filter_type: str = None  # Tùy chọn: 'hospital', 'police', v.v.

@router.post("/nearest")
async def get_nearest_rescue(location: UserLocation):
    """
    API tìm nơi viện trợ gần nhất dựa trên tọa độ người dùng.
    """
    try:
        result = rescue_finder.find_nearest_station(
            location.lat, 
            location.lon, 
            location.filter_type
        )
        
        if result:
            return {
                "status": "success",
                "data": result,
                "message": "Đã tìm thấy trạm gần nhất"
            }
        else:
            return {
                "status": "not_found", 
                "message": "Không tìm thấy dữ liệu hoặc không có trạm phù hợp"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))