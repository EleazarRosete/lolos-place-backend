import xgboost as xgb
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Load a clean dataset
data = fetch_california_housing()
X, y = data.data, data.target

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Convert to DMatrix
dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

# Define parameters
params = {
    "objective": "reg:squarederror",
    "eval_metric": "rmse"
}

# Train model
model = xgb.train(params, dtrain, num_boost_round=10)

# Predict
predictions = model.predict(dtest)

# Evaluate
mse = mean_squared_error(y_test, predictions)
print(f"✅ XGBoost model ran successfully. MSE: {mse:.4f}")
