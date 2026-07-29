import joblib
import pandas as pd

model_bundle: dict = {}


def load_model(model_path: str) -> None:
    model_bundle["model"] = joblib.load(model_path)


def predict(df: pd.DataFrame) -> float:
    model = model_bundle.get("model")
    if model is None:
        raise RuntimeError("Model is not loaded yet.")
    prediction = model.predict(df)
    return float(prediction[0])
