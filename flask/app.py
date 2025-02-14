from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import pandas as pd
import xgboost as xgb
import os
from dotenv import load_dotenv
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


# Fetch aggregated sales data from database (excluding the current year)
def get_sales_data():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        query = """
            SELECT 
                EXTRACT(YEAR FROM date::DATE) AS year,
                EXTRACT(MONTH FROM date::DATE) AS month,
                SUM(gross_sales) AS total_sales
            FROM sales_data 
            WHERE EXTRACT(YEAR FROM date::DATE) < EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY EXTRACT(YEAR FROM date::DATE), EXTRACT(MONTH FROM date::DATE)
            ORDER BY year, month;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        if df.empty:
            print("⚠️ Warning: No sales data found.")
            return None  # Prevents errors later

        return df

    except Exception as e:
        print("❌ Database Error:", str(e))
        return None  # Return None if an error occurs


# Preprocess the aggregated data
def preprocess_data(df):
    print("🔄 Preprocessing Aggregated Sales Data...")

    if df.empty:
        print("❌ DataFrame is empty!")
        return None

    try:
        # Ensure numeric types
        df['year'] = df['year'].astype(int)
        df['month'] = df['month'].astype(int)
        df['total_sales'] = df['total_sales'].astype(float)
        # Sort data for consistency
        df = df.sort_values(['year', 'month'])
        return df
    except Exception as e:
        print("❌ Data preprocessing error:", e)
        return None


# Flask API route for per-month sales prediction
@app.route("/predict-sales", methods=["GET"])
def predict_sales_api():
    df = get_sales_data()

    if df is None:
        print("❌ Failed to fetch data: get_sales_data() returned None.")
        return jsonify({"error": "Database query failed"}), 500

    if df.empty:
        print("⚠️ Warning: No data retrieved from the database.")
        return jsonify({"error": "No sales data available"}), 500

    print("✅ Fetched Data (First 5 Rows):\n", df.head())

    df = preprocess_data(df)
    if df is None:
        return jsonify({"error": "Data preprocessing failed"}), 500

    # Force prediction for the current year: 2025 (as historical data covers 2019-2024)
    current_year = 2025
    predictions = {}

    # For each month, filter historical data, train a model, and predict sales for the current year's month
    for month in range(1, 13):
        df_month = df[df['month'] == month]
        if df_month.empty:
            print(f"⚠️ No historical data for month {month}.")
            predictions[f"{current_year}-{month:02d}"] = None
            continue

        # Use 'year' as the only feature
        X = df_month[['year']]
        y = df_month['total_sales']

        # Train an XGBoost model on historical data for this month
        model = xgb.XGBRegressor(objective="reg:squarederror", n_estimators=100, learning_rate=0.1, max_depth=5)
        model.fit(X, y)

        # Predict the sales for the current year's month using just the year as input
        future = pd.DataFrame({'year': [current_year]})
        pred = model.predict(future)
        predictions[f"{current_year}-{month:02d}"] = float(pred[0])

    return jsonify({
        "year": current_year,
        "predicted_sales": predictions
    })


if __name__ == "__main__":
    print(f"🚀 Starting Flask server on port {app_port}...")
    app.run(host="0.0.0.0", port=app_port, debug=True)
