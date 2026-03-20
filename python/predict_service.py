"""
Weight Prediction Flask Microservice
=====================================
Trains a RandomForestRegressor on startup from the Kaggle weight-change dataset
and serves predictions via POST /predict.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
import os

app = Flask(__name__)
CORS(app)

# ─── Global model variables ──────────────────────────────────
model = None
transformer = None

def train_model():
    """Load the dataset and train the RandomForestRegressor."""
    global model, transformer

    # Try to find the CSV in the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_path = os.path.join(project_root, "weight_change_dataset.csv")

    if not os.path.exists(csv_path):
        # Fallback: try kagglehub
        try:
            import kagglehub
            path = kagglehub.dataset_download("abdullah0a/comprehensive-weight-change-prediction")
            csv_path = os.path.join(path, "weight_change_dataset.csv")
        except Exception as e:
            print(f"Could not download dataset: {e}")
            return False

    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)

    # Prepare features and target
    X = df.drop(["Participant ID", "Final Weight (lbs)", "Weight Change (lbs)", "Daily Caloric Surplus/Deficit"], axis=1)
    y = df["Final Weight (lbs)"]

    # One-hot encode categorical features
    categorical_features = ["Gender", "Physical Activity Level", "Sleep Quality"]
    one_hot = OneHotEncoder(handle_unknown='ignore')
    transformer = ColumnTransformer(
        [("one_hot", one_hot, categorical_features)],
        remainder="passthrough"
    )

    transformed_X = transformer.fit_transform(X)

    # Train the model
    np.random.seed(42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(transformed_X, y)

    # Quick score check
    score = model.score(transformed_X, y)
    print(f"Model trained successfully! R² score: {score:.4f}")
    return True


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict final weight given user features.
    
    Expected JSON body:
    {
        "age": 25,
        "gender": "M",
        "current_weight_lbs": 165.0,
        "bmr": 1800.0,
        "daily_calories": 2200.0,
        "duration_weeks": 8,
        "activity_level": "Very Active",
        "sleep_quality": "Good",
        "stress_level": 3
    }
    """
    if model is None or transformer is None:
        return jsonify({"error": "Model not loaded"}), 503

    try:
        data = request.get_json()
        
        # Validate required fields
        required = [
            'age', 'gender', 'current_weight_lbs', 'bmr',
            'daily_calories', 'duration_weeks', 
            'activity_level', 'sleep_quality', 'stress_level'
        ]
        
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        # Build input DataFrame matching training columns
        columns = [
            "Age", "Gender", "Current Weight (lbs)", "BMR (Calories)",
            "Daily Calories Consumed", "Duration (weeks)",
            "Physical Activity Level", "Sleep Quality", "Stress Level"
        ]

        input_data = [[
            data['age'],
            data['gender'],
            data['current_weight_lbs'],
            data['bmr'],
            data['daily_calories'],
            data['duration_weeks'],
            data['activity_level'],
            data['sleep_quality'],
            data['stress_level']
        ]]

        input_df = pd.DataFrame(input_data, columns=columns)

        # Transform and predict
        transformed = transformer.transform(input_df)
        predicted_lbs = model.predict(transformed)[0]
        predicted_kg = predicted_lbs * 0.45359237

        current_kg = data['current_weight_lbs'] * 0.45359237
        weight_change_kg = predicted_kg - current_kg

        return jsonify({
            "predicted_weight_kg": round(predicted_kg, 2),
            "predicted_weight_lbs": round(predicted_lbs, 2),
            "current_weight_kg": round(current_kg, 2),
            "weight_change_kg": round(weight_change_kg, 2),
            "duration_weeks": data['duration_weeks']
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("Starting Weight Prediction Service...")
    success = train_model()
    if success:
        print("Starting Flask server on port 5001...")
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("Failed to train model. Service not started.")
