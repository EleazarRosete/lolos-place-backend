from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor

# Load environment variables
load_dotenv()
app_port = int(os.getenv("APP_PORT", 5000))

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

# Create SQLAlchemy engine
def create_db_connection():
    connection_string = f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    engine = create_engine(connection_string)
    return engine

# Fetch sales data from database
def get_sales_data():
    try:
        engine = create_db_connection()
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
        df = pd.read_sql_query(query, engine)
        return df if not df.empty else None
    except Exception as e:
        print("❌ Database Error:", str(e))
        return None

# Preprocessing data with additional trend features
def preprocess_data(df):
    if 'month' not in df.columns:
        raise ValueError("Missing 'month' column in the data")
    
    current_year = datetime.now().year
    df['year'] = current_year

    df['decline_march'] = (df['month'] == 3).astype(int)
    df['rise_september'] = (df['month'] == 9).astype(int)
    
    df['lag_1'] = df['total_sales'].shift(1).fillna(0)
    df['rolling_mean_3'] = df['total_sales'].rolling(window=3).mean().fillna(0)
    df['rolling_mean_6'] = df['total_sales'].rolling(window=6).mean().fillna(0)
    
    return df

# Prepare features
def prepare_features(df):
    X = df.drop(columns=["total_sales"])
    y = df["total_sales"]
    return X, y

# Align features for future predictions
def align_features(X_train, X_future):
    missing_cols = set(X_train.columns) - set(X_future.columns)
    for col in missing_cols:
        X_future[col] = 0
    
    X_future = X_future[X_train.columns]
    
    return X_future

# Train model
def train_model(X, y):
    model = RandomForestRegressor(random_state=42)
    
    param_grid = {
        'n_estimators': [100, 200, 500],
        'max_depth': [10, 20, None],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'max_features': ['auto', 'sqrt', 'log2']
    }

    grid_search = GridSearchCV(estimator=model, param_grid=param_grid, cv=5, n_jobs=-1, scoring="neg_mean_absolute_error")
    grid_search.fit(X, y)
    
    best_model = grid_search.best_estimator_
    best_model.fit(X, y)
    
    return best_model

# Predict future sales
def predict_sales(model, X_future):
    return model.predict(X_future)

@app.route("/predict-sales", methods=["GET"])
def predict_sales_api():
    df = get_sales_data()
    if df is None:
        return jsonify({"error": "No sales data available"}), 500
    
    df = preprocess_data(df)
    X, y = prepare_features(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = train_model(X_train, y_train)
    
    current_year = datetime.now().year
    future_dates = pd.DataFrame({'month': list(range(1, 13)), 'year': [current_year] * 12})
    
    future_dates['decline_march'] = (future_dates['month'] == 3).astype(int)
    future_dates['rise_september'] = (future_dates['month'] == 9).astype(int)
    
    future_dates['lag_1'] = 0
    future_dates['rolling_mean_3'] = 0
    future_dates['rolling_mean_6'] = 0
    
    X_future = align_features(X_train, future_dates)

    predictions = predict_sales(model, X_future)
    
    return jsonify({
        "year": current_year,
        "predicted_sales": {f"{current_year}-{month:02d}": float(pred) for month, pred in zip(range(1, 13), predictions)}
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app_port, debug=True)
