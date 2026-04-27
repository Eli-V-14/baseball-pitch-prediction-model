import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import Optional

import uvicorn
import os

load_dotenv()

URL = os.getenv("DATABASE_URL")
client = MongoClient(URL)
db = client["final_project"]
collection = db["savant"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and shared artifacts
models = {
    "RandomForest": joblib.load("backend/randomforest_model.pkl"),
    "CatBoost":     joblib.load("backend/catboost_model.pkl"),
    "XGBoost":      joblib.load("backend/xgboost_model.pkl"),
}
label_encoder     = joblib.load("backend/label_encoder.pkl")
selected_features = joblib.load("backend/selected_features.pkl")
cat_cols          = joblib.load("backend/cat_cols.pkl")
numeric_expected  = joblib.load("backend/numeric_expected.pkl")

SANITY_CHECKS = {
    "release_speed":     (40, 110),
    "release_spin_rate": (500, 4000),
    "spin_axis":         (0, 360),
}

class PitchInput(BaseModel):
    # Physics — primary features
    release_speed:     Optional[float] = None
    release_spin_rate: Optional[float] = None
    spin_axis:         Optional[float] = None
    pfx_x:             Optional[float] = None
    pfx_z:             Optional[float] = None
    vx0:               Optional[float] = None
    vy0:               Optional[float] = None
    vz0:               Optional[float] = None
    ax:                Optional[float] = None
    ay:                Optional[float] = None
    az:                Optional[float] = None
    release_pos_x:     Optional[float] = None
    release_pos_y:     Optional[float] = None
    release_pos_z:     Optional[float] = None
    release_extension: Optional[float] = None
    # Context — secondary features
    p_throws:              Optional[str]   = None
    stand:                 Optional[str]   = None
    balls:                 Optional[int]   = 0
    strikes:               Optional[int]   = 0
    outs_when_up:          Optional[int]   = 0
    inning:                Optional[int]   = 1
    inning_topbot:         Optional[str]   = None
    on_1b:                 Optional[float] = 0
    on_2b:                 Optional[float] = 0
    on_3b:                 Optional[float] = 0
    home_score_diff:       Optional[float] = 0
    n_thruorder_pitcher:   Optional[int]   = 1
    # Request config
    model_name: Optional[str] = None
    top_k:      Optional[int] = 3

@app.get("/models")
def list_models():
    return {"models": list(models.keys())}

@app.post("/predict")
def predict(data: PitchInput):
    model_name = data.model_name or list(models.keys())[0]
    if model_name not in models:
        raise HTTPException(400, f"Unknown model '{model_name}'. Choose from {list(models.keys())}")

    row = data.dict(exclude={"model_name", "top_k"})
    row_df = pd.DataFrame([row])

    # Sanity check — mirror training filters
    warnings = []
    for col, (lo, hi) in SANITY_CHECKS.items():
        val = row_df[col].iloc[0]
        if pd.notna(val) and not (lo <= val <= hi):
            warnings.append(f"{col} value {val} is outside expected range ({lo}–{hi})")

    # Align columns to training order, fill missing as NaN
    for col in selected_features:
        if col not in row_df.columns:
            row_df[col] = np.nan
    row_df = row_df[selected_features]

    # Coerce numerics
    for c in numeric_expected:
        if c in row_df.columns:
            row_df[c] = pd.to_numeric(row_df[c], errors="coerce")

    # CatBoost needs string categoricals
    for c in cat_cols:
        if c in row_df.columns:
            row_df[c] = row_df[c].astype(str)

    model  = models[model_name]
    probs  = model.predict_proba(row_df)[0]
    top_k  = data.top_k or 3
    order  = np.argsort(probs)[::-1][:top_k]
    labels = label_encoder.inverse_transform(order)

    return {
        "model_used":     model_name,
        "top_prediction": labels[0],
        "confidence":     round(float(probs[order[0]]) * 100, 1),
        "all_predictions": [
            {"pitch_type": lbl, "probability": round(float(probs[i]) * 100, 1)}
            for lbl, i in zip(labels, order)
        ],
        "warnings": warnings,
    }

@app.get("/data")
def get_data(skip: int = Query(0), limit: int = Query(200)):
    docs  = list(collection.find({}, {"_id": 0}).skip(skip).limit(limit))
    total = collection.count_documents({})
    return {"data": docs, "total": total}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)