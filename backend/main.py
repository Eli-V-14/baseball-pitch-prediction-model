import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Allow React dev server to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uncomment when model is trained and saved
# model = joblib.load('pitch_prediction_model.pkl')

# Serve static files (your HTML/CSS/JS)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# @app.get("/")
# def serve_frontend():
#     return FileResponse('static/index.html')

class PitchData(BaseModel):
    balls: int
    strikes: int
    outs_when_up: int
    inning: int
    on_1b: int
    on_2b: int
    on_3b: int
    home_score_diff: int
    n_thruorder_pitcher: int
    release_speed: float
    release_spin_rate: float
    spin_axis: float
    p_throws_R: int
    stand_R: int
    inning_topbot_Top: int
    
@app.post("/predict")
def predict_pitch(pitch_data: PitchData):
    # Convert the input data to a DataFrame
    # input_df = pd.DataFrame([pitch_data.dict()])
    
    # # Make prediction using the loaded model
    # prediction = model.predict(input_df)[0]
    
    return {"predicted_pitch_type": "fastball"}

if __name__ == "__main__":  
    uvicorn.run(app, host="localhost", port=3000)   