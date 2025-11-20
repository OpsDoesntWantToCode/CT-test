import os

# Đường dẫn gốc của dự án
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Đường dẫn dữ liệu
DATA_DIR = os.path.join(BASE_DIR, "data")
HISTORY_PATH = os.path.join(DATA_DIR, "history", "history.csv")
INFRA_PATH = os.path.join(DATA_DIR, "infrastructure")
MODEL_PATH = os.path.join(DATA_DIR, "models", "xgboost_safety.json")

# Cấu hình model
MODEL_PARAMS = {
    "n_estimators": 100,
    "learning_rate": 0.1,
    "max_depth": 5,
    "objective": "reg:squarederror"
}