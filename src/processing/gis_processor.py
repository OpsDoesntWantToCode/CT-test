import os
import glob
import rasterio
from src.config import INFRA_PATH

class GisProcessor:
    def __init__(self):
        self.infra_path = INFRA_PATH

    def get_land_cover(self, lat: float, lon: float) -> int:
        """
        Tìm giá trị Land Cover từ các file .tif trong thư mục infrastructure
        Trả về: Mã land cover (int) hoặc 0 nếu không tìm thấy
        """
        tif_files = glob.glob(os.path.join(self.infra_path, "*.tif"))
        
        for tif_file in tif_files:
            try:
                with rasterio.open(tif_file) as src:
                    # Kiểm tra xem tọa độ có nằm trong phạm vi file này không
                    if (src.bounds.left <= lon <= src.bounds.right and 
                        src.bounds.bottom <= lat <= src.bounds.top):
                        
                        # Chuyển đổi Lat/Lon sang index pixel
                        try:
                            row, col = src.index(lon, lat)
                            # Đọc 1 pixel
                            window = rasterio.windows.Window(col, row, 1, 1)
                            data = src.read(1, window=window)
                            if data.size > 0:
                                return int(data[0, 0])
                        except Exception:
                            continue
            except Exception as e:
                print(f"Loi doc file GIS {tif_file}: {e}")
                continue
        
        return 0 # Mặc định (ví dụ: biển)