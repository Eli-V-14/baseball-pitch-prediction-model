# Baseball-Pitch-Prediction-Model
This project aims to develop a frontend and backend application that predicts the type of pitch a baseball pitcher will throw based on current game scenario and player attributes. By using machine learning, this tool provides real-time pitch type predictions that can be used by coaches, analysts, and fans to better understand pitch tendencies and decision making. 

## Purpose

Baseball is a strategical game and pitch selection is one of the most critical decisions a pitcher makes. This application uses historical MLB pitch data to train a machine learning model that predicts what type of pitch wil lbe thrown given a set of conditions such as count, inning, batter stance, and pitcher handedness. 

# Python Libraries/Dependencies
- pymongo : for connecting to MongoDB and fetching data
- pandas : for data manipulation and analysis
- joblib : for saving and loading the trained model
- fastapi : for building the API server
- pydantic : for defining data models and validation
- uvicorn : for running the FastAPI server
- python-dotenv : for environment variables
- scikit-learn : for the Random Forest model and label encoding
- catboost : for the CatBoost model
- xgboost : for the XGBoost model

# Extensions
- MongoDB for VS Code
- ES7 + React/Redux/React-Native snippets
- Prettier

# Setup Backend (Virtual Environment)
It is highly recommended to use a virtual environment for the backend. Run these commands from the root of the project (`baseball-pitch-prediction-model`):

1. **Create the virtual environment:**
   ```powershell
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   ```powershell
   .\venv\Scripts\activate
   ```

3. **Install the dependencies:**
   ```powershell
   pip install fastapi uvicorn pymongo pandas joblib python-dotenv scikit-learn catboost xgboost
   ```

# Terminal 1 (Backend)
Once the virtual environment is set up and activated, run the following:
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

# Terminal 2
- **cd frontend** --> **npm start**