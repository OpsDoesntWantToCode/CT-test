# 🛡️ Vietnam Safety Score System

Hệ thống đánh giá và dự đoán **Điểm An Toàn (Safety Score)** theo thời
gian thực dựa trên dữ liệu thiên tai lịch sử và thông tin địa lý (GIS)
tại Việt Nam.\
Dự án sử dụng **FastAPI** để triển khai dịch vụ và **XGBoost** để đánh
giá rủi ro.

## 🚀 Tính Năng Chính

-   **Tích hợp GIS:**\
    Tự động trích xuất thông tin **Land Cover** từ ảnh vệ tinh (`.tif`)
    dựa trên tọa độ Lat/Lon.

-   **Mô hình Machine Learning:**\
    Sử dụng **XGBoost** để học từ dữ liệu thiên tai trong `history.csv`
    và xác định **Vulnerability** của từng vùng.

-   **Dynamic Scoring:**\
    Kết hợp **lịch sử thiên tai** và **thời tiết hiện tại** (mưa, bão,
    gió) để tính điểm an toàn.

-   **FastAPI hiệu năng cao:**\
    Tích hợp Swagger UI giúp kiểm thử trực tiếp.

## 📂 Cấu Trúc Dự Án

``` plaintext
safety_score_project/
│
├── data/
│   ├── history/
│   │   └── history.csv
│   ├── infrastructure/
│   │   ├── N08E104_2020_...tif
│   │   └── ...
│   └── models/
│       └── xgboost_safety.json
│
├── src/
│   ├── api/             # API endpoints
│   ├── ml/              # Training & Prediction logic
│   ├── processing/      # GIS & Data processing
│   ├── schemas/         # Pydantic models
│   └── config.py        # Configurations
│
├── main.py              # API server entry point
├── requirements.txt
└── README.md
```

## 🛠️ Cài Đặt Môi Trường

**Yêu cầu:** Python 3.9+

### 1️⃣ Clone dự án

``` bash
git clone https://github.com/your-username/vietnam-safety-score.git
cd vietnam-safety-score
```

### 2️⃣ Cài đặt thư viện

``` bash
pip install -r requirements.txt
```

### 3️⃣ Chuẩn bị dữ liệu

-   Đặt `history.csv` vào thư mục:

        data/history/

-   Đặt các file GIS `.tif` vào thư mục:

        data/infrastructure/

## 🧠 Huấn Luyện Mô Hình (Training)

Chạy lệnh sau từ thư mục gốc:

``` bash
python -m src.ml.trainer
```

**Quy trình gồm:**

-   Đọc dữ liệu lịch sử từ `history.csv` (encoding: ISO-8859-1)\

-   Quét toàn bộ file `.tif` để gắn nhãn **Land Cover**\

-   Huấn luyện mô hình **XGBoost Regressor**\

-   Lưu model tại:

        data/models/xgboost_safety.json

## ⚡ Khởi Chạy API

Sau khi train xong model, chạy API:

``` bash
python main.py
```

-   Server chạy tại:\
    **http://0.0.0.0:8000**

-   Swagger UI:\
    **http://localhost:8000/docs**

## 📖 Hướng Dẫn Sử Dụng API

### **Endpoint: Dự đoán điểm an toàn**

-   **URL:** `/api/v1/predict`\
-   **Method:** `POST`

### 🔹 Ví dụ Request (JSON)

``` json
{
  "city": "Hue",
  "lat": 16.46,
  "lon": 107.59,
  "temperature_C": 28,
  "humidity": 75,
  "pressure": 1005,
  "wind_speed": 15,
  "weather_description": "Cloudy",
  "rain_probability": 0.3,
  "storm_probability": 0.1,
  "alert_event": "None",
  "alert_description": null,
  "alert_start": null,
  "alert_end": null,
  "earthquake_mag": 0,
  "earthquake_place": null,
  "fire_count": 0,
  "fire_confidence_max": 0,
  "timestamp": "2023-10-25T10:00:00",
  "risk_polygon": {
    "type": "Polygon",
    "coordinates": [
      [
        [107.0, 17.0],
        [109.0, 17.0],
        [109.0, 15.0],
        [107.0, 15.0],
        [107.0, 17.0]
      ]
    ]
  }
}
```

### 🔹 Ví dụ Response

``` json
{
  "safety_score": 68.5,
  "risk_level": "Low",
  "details": "Prediction for Hue at (16.46, 107.59)"
}
```

## 🧭 Thang Đánh Giá Rủi Ro

| **Safety Score** | **Risk Level**      | **Mô tả**                           |
|------------------|----------------------|--------------------------------------|
| 80 — 100         | Info / Low          | An toàn                              |
| 50 — 79          | Low / Medium        | Có rủi ro nhẹ                        |
| 25 — 49          | Medium              | Nguy hiểm, hạn chế di chuyển         |
| 0 — 24           | High                | Rất nguy hiểm, nên sơ tán            |

## ⚙️ Logic Tính Toán

### Công thức:

    SafetyScore = 100 - (Threat × Vulnerability)

### **Vulnerability** (Mức độ dễ tổn thương):

-   Dự đoán bởi XGBoost\
-   Dựa trên vị trí địa lý, loại đất (GIS), lịch sử thiệt hại

### **Threat** (Mối đe dọa thời gian thực):

-   Tốc độ gió\
-   Xác suất mưa\
-   Xác suất bão\
-   Các cảnh báo thiên tai
