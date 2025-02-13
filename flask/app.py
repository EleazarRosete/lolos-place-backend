from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import pandas as pd
import xgboost as xgb
import os
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from datetime import datetime

# Load environment variables
load_dotenv()

# Ensure port is an integer
app_port = int(os.getenv("APP_PORT", 5000))  # Default to 5000 if not set

# Flask app setup
app = Flask(__name__)
CORS(app)

# Database Configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_DATABASE"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}

# Debug: Print database config (without password for security)
print("🔹 DB Config:", {k: v for k, v in DB_CONFIG.items() if k != "password"})

# Test database connection
try:
    conn = psycopg2.connect(**DB_CONFIG)
    print("✅ Database connection successful!")
    conn.close()
except Exception as e:
    print("❌ Database connection failed:", str(e))


# Fetch sales data from database
def get_sales_data():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        query = "SELECT date, gross_sales FROM sales_data;"
        df = pd.read_sql_query(query, conn)  # FIXED: Use `read_sql_query`
        conn.close()

        if df.empty:
            print("⚠️ Warning: No sales data found.")
            return None  # Prevents errors later

        return df

    except Exception as e:
        print("❌ Database Error:", str(e))
        return None  # Return None if an error occurs


def preprocess_data(df):
    print("\U0001F537 Preprocessing Data...")

    if df.empty:
        print("\u274C DataFrame is empty!")
        return None

    if 'date' not in df.columns:
        print("\u274C Column 'date' is missing!")
        return None

    try:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
    except Exception as e:
        print(f"\u274C Date conversion failed: {e}")
        return None

    # Identify invalid dates (NaT values after conversion)
    invalid_dates = df[df['date'].isnull()]
    if not invalid_dates.empty:
        print("⚠️ Warning: Some 'date' values are invalid and could not be converted.")
        print("🚨 Invalid Date Values:")
        print(invalid_dates)
    
    # Drop only rows where the date is NaT (invalid)
    df = df.dropna(subset=['date'])
    
    df = df.sort_values('date')
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df.drop(columns=['date'], inplace=True)  # Remove the date column

    return df


# Prepare features and target variable
def prepare_features(df):
    X = df.drop(columns=["gross_sales"])  # Features
    y = df["gross_sales"]  # Target
    return X, y


# Train XGBoost model
def train_model(X, y):
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = xgb.XGBRegressor(
            objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=5
        )
        model.fit(X_train, y_train)

        return model
    except Exception as e:
        print("❌ Model Training Error:", str(e))
        return None


# Predict future sales
def predict_sales(model, X_future):
    try:
        return model.predict(X_future)
    except Exception as e:
        print("❌ Prediction Error:", str(e))
        return None


# Flask API route for sales prediction
@app.route("/predict-sales", methods=["GET"])
def predict_sales_api():
    df = get_sales_data()

    if df is None:
        print("❌ Failed to fetch data: get_sales_data() returned None.")
        return jsonify({"error": "Database query failed"}), 500

    if df.empty:
        print("⚠️ Warning: No data retrieved from the database.")
        return jsonify({"error": "No sales data available"}), 500

    print("✅ Fetched Data (First 5 Rows):\n", df.head())  # Debug output

    print("✅ Raw Data Preview:\n", df.head())
    print("🔹 Columns:", df.columns)

    df = preprocess_data(df)
    if df is None:
        return jsonify({"error": "Data preprocessing failed"}), 500

    X, y = prepare_features(df)

    model = train_model(X, y)
    if model is None:
        return jsonify({"error": "Model training failed"}), 500

    # Generate 12 months of predictions for the current year
    current_year = datetime.now().year
    future_dates = pd.DataFrame({
        'month': list(range(1, 13)),  # January to December
        'year': [current_year] * 12  # Current year
    })

    predictions = predict_sales(model, future_dates)
    if predictions is None:
        return jsonify({"error": "Prediction failed"}), 500

    return jsonify({
        "year": current_year,
        "predicted_sales": {f"{current_year}-{month:02d}": float(pred) for month, pred in zip(range(1, 13), predictions)}
    })


if __name__ == "__main__":
    print(f"🚀 Starting Flask server on port {app_port}...")
    app.run(host="0.0.0.0", port=app_port, debug=True)
