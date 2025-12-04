import os
import joblib
import numpy as np
import xgboost as xgb

# Lấy BASE_DIR của project backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL_PATH = os.path.join(BASE_DIR, "data", "models", "xgboost_safety.json")
FEATURES_PATH = os.path.join(BASE_DIR, "data", "models", "features_list.pkl")

class HazardPredictor:
    def __init__(self):
        self.model = None
        self.features = []
        self._load_model()

        # Map nhãn từ số → text
        self.HAZARD_MAP = {
            0: "No",
            1: "Rain",
            2: "Storm",
            3: "Wind",
            4: "Flood"
        }

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"❌ Model not found: {MODEL_PATH}")
        
        if not os.path.exists(FEATURES_PATH):
            raise FileNotFoundError(f"❌ Feature list missing: {FEATURES_PATH}")

        self.model = xgb.Booster()
        self.model.load_model(MODEL_PATH)

        self.features = joblib.load(FEATURES_PATH)
        print(f"✅ Hazard Model loaded successfully from {MODEL_PATH}")

    def _prepare(self, data: dict):
        """Chuẩn bị dữ liệu input theo đúng thứ tự features từ model"""
        try:
            row = []
            for feature in self.features:
                # Lấy giá trị từ input_data, mặc định là 0.0 nếu không có
                value = float(data.get(feature, 0.0))
                row.append(value)
            return np.array(row).reshape(1, -1)
        except Exception as e:
            print(f"⚠️ Error preparing data: {e}")
            # Fallback: tạo array zeros với đúng số features
            return np.zeros((1, len(self.features)))

    def predict_overall_hazard(self, input_data: dict):
        """Dự đoán loại thảm họa từ dữ liệu đầu vào"""
        try:
            X = self._prepare(input_data)
            dmatrix = xgb.DMatrix(X)

            pred_raw = self.model.predict(dmatrix)[0]
            # Nếu pred_raw là mảng xác suất, lấy index max; nếu là scalar, chuyển thành int
            label_id = int(np.argmax(pred_raw)) if len(pred_raw) > 1 else int(pred_raw)

            return self.HAZARD_MAP.get(label_id, "Unknown")
        except Exception as e:
            print(f"⚠️ Prediction error: {e}")
            return "Unknown"
