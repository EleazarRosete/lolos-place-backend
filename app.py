from flask import Flask, jsonify, request, send_file
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from flask_cors import CORS
import plotly.graph_objects as go
import plotly.io as pio
import matplotlib.pyplot as plt
import io
import psycopg2
import numpy as np
import kaleido  # Ensure kaleido is installed
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime  # Import datetime module
import base64
from dotenv import load_dotenv
import os
from urllib.parse import urlparse

# Load environment variables from the .env file
load_dotenv(dotenv_path='./backend/.env')
app_port = os.getenv('APP_PORT')


app = Flask(__name__)
CORS(app)

analyzer = SentimentIntensityAnalyzer()

# Determine if DATABASE_URL is provided (e.g., in a production environment)
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Parse the DATABASE_URL for production
    url = urlparse(DATABASE_URL)
    db_config = {
        'dbname': url.path[1:],  # Remove leading '/'
        'user': url.username,
        'password': url.password,
        'host': url.hostname,
        'port': url.port,
        'sslmode': 'require'  # Enforce SSL for production
    }
# else:
#     # Default to local development settings
#     db_config = {
#         'dbname': os.getenv('DB_DATABASE', 'lolos-place'),
#         'user': os.getenv('DB_USER', 'postgres'),
#         'password': os.getenv('DB_PASSWORD', 'password'),
#         'host': os.getenv('DB_HOST', 'localhost'),
#         'port': os.getenv('DB_PORT', '5433')
#     }

# Function to get the database connection
def get_db_connection():
    return psycopg2.connect(**db_config)






@app.route('/test-db')
def test_db():
    try:
        # Establish a database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Execute a simple query to test the connection
        cursor.execute('SELECT 1;')
        result = cursor.fetchone()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        return jsonify({'message': 'Database connected successfully', 'result': result})
    except Exception as e:
        return jsonify({'error': 'Failed to connect to the database', 'details': str(e)}), 500



    
@app.route('/highest-selling-products', methods=['GET'])
def product_demand_per_month():
    try:
        year = request.args.get('year')  # Capture year parameter from query string
        month = request.args.get('month')  # Capture month parameter from query string
        if not year or not month:
            return jsonify({"error": "Year and month are required"}), 400  # Handle missing year or month
        
        # Connect to the database
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                 WITH monthly_sales AS (
                    SELECT 
                        product_name,
                        DATE_TRUNC('month', date::DATE) AS sale_month,
                        SUM(quantity_sold) AS total_quantity_sold
                    FROM sales_data
                    WHERE EXTRACT(YEAR FROM date::DATE) = %s  -- Filter by year
                    AND EXTRACT(MONTH FROM date::DATE) = %s  -- Filter by month
                    GROUP BY product_name, DATE_TRUNC('month', date::DATE)
                    ORDER BY sale_month, total_quantity_sold DESC
                 )
                 SELECT 
                    sale_month,
                    product_name,
                    total_quantity_sold
                 FROM monthly_sales;
                """, (year, month))
                data = cursor.fetchall()

        if not data:
            return jsonify({"error": "No sales data available for the given month and year"}), 404

        # Prepare data for visualization
        result = {}
        for row in data:
            month = row[0].strftime('%Y-%m')  # Format date as Year-Month
            if month not in result:
                result[month] = []
            result[month].append({"product_name": row[1], "quantity_sold": row[2]})

        return jsonify(result)

    except psycopg2.Error as e:
        print("Database error:", e)
        return jsonify({"error": "Database error: " + str(e)}), 500
    except Exception as e:
        print("General error:", e)
        return jsonify({"error": "Error in fetching product demand per month: " + str(e)}), 500



@app.route('/sales-forecast', methods=['POST'])
def sales_forecast():
    try:
        # Connect to the database
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        EXTRACT(YEAR FROM CAST(date AS DATE)) AS year,
                        EXTRACT(MONTH FROM CAST(date AS DATE)) AS month,
                        SUM(gross_sales) AS total_gross_sales
                    FROM sales_data
                    WHERE EXTRACT(YEAR FROM CAST(date AS DATE)) >= 2019
                    GROUP BY year, month
                    ORDER BY year, month;
                """)
                data = cursor.fetchall()

        # If no data is found
        if not data:
            return jsonify({"error": "No sales data available for forecasting"}), 404

        # Prepare data for forecasting
        df = pd.DataFrame(data, columns=['year', 'month', 'total_gross_sales'])

        # Combine year and month to create a date column (first day of each month)
        df['date'] = pd.to_datetime(df[['year', 'month']].assign(day=1))

        # Ensure the data has valid values
        df = df.dropna(subset=['date', 'total_gross_sales'])

        # Check if the cleaned data is empty
        if df.empty:
            return jsonify({"error": "Data is empty after cleaning"}), 404

        # Convert date to ordinal for modeling
        df['date_ordinal'] = df['date'].apply(lambda x: x.toordinal())

        # Prepare independent (X) and dependent (y) variables
        X = df['date_ordinal'].values.reshape(-1, 1)
        y = df['total_gross_sales'].values

        # Ensure there is enough data for linear regression
        if len(X) < 2:  # Need at least two data points to fit the model
            return jsonify({"error": "Not enough data to fit the model"}), 400

        # Create a Linear Regression model and fit the data
        model = LinearRegression()
        model.fit(X, y)

        # Calculate predicted sales for the current month
        current_month = datetime.now().month
        current_year = datetime.now().year
        current_month_date = datetime(current_year, current_month, 1)
        current_month_ordinal = np.array([current_month_date.toordinal()]).reshape(-1, 1)
        predicted_sales_this_month = model.predict(current_month_ordinal)

        # Prepare the result for predicted sales for the current month
        predicted_sales_current_month = {
            'year': current_year,
            'month': current_month,
            'predicted_sales': predicted_sales_this_month.tolist()[0]
        }

        # Prepare historical sales data grouped by year and month
        sales_per_month = []
        for _, row in df.iterrows():
            sales_per_month.append({
                'year': int(row['year']),
                'month': int(row['month']),
                'total_gross_sales': row['total_gross_sales']
            })

        # Prepare the response data
        response_data = {
            'sales_per_month': sales_per_month,
            'predicted_sales_current_month': predicted_sales_current_month
        }

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": "Error in forecasting sales: " + str(e)}), 500



@app.route('/feedback-graph', methods=['POST'])
def feedback_graph():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT sentiment, COUNT(*) 
                    FROM feedback 
                    GROUP BY sentiment;
                """)
                sentiment_data = cursor.fetchall()

        if not sentiment_data:
            return jsonify({"error": "No feedback data available"}), 404

        # Extract sentiments and counts dynamically
        sentiments = [row[0].capitalize() for row in sentiment_data]
        counts = [row[1] for row in sentiment_data]

        # Define default colors for known sentiments
        sentiment_colors = {
            "Positive": "green",
            "Negative": "red",
            "Neutral": "gray"
        }
        # Assign colors dynamically, default to blue for unknown sentiments
        colors = [sentiment_colors.get(sentiment, "blue") for sentiment in sentiments]

        # Generate the pie chart
        fig = go.Figure(data=[go.Pie(labels=sentiments, values=counts, marker=dict(colors=colors))])

        fig.update_layout(
            title="Sentiment Distribution",
            showlegend=True,
            plot_bgcolor="white",
            paper_bgcolor="white",
            font=dict(color="black"),
        )

        # Convert the figure to an SVG image using Kaleido
        img_io = io.BytesIO()
        pio.write_image(fig, img_io, format='svg')
        img_io.seek(0)

        return send_file(img_io, mimetype='image/svg+xml')

    except Exception as e:
        print("Error generating feedback graph:", e)
        return jsonify({"error": "Error generating graph"}), 500

@app.route('/feedback-stats', methods=['GET'])
def feedback_stats():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT sentiment, COUNT(*) 
                    FROM feedback 
                    GROUP BY sentiment;
                """)
                sentiment_data = cursor.fetchall()

        if not sentiment_data:
            return jsonify({"error": "No feedback data available"}), 404

        # Prepare the data for response
        total_feedbacks = sum(row[1] for row in sentiment_data)
        feedback_stats = {
            "total": total_feedbacks,
            "positive": next((row[1] for row in sentiment_data if row[0].lower() == "positive"), 0),
            "negative": next((row[1] for row in sentiment_data if row[0].lower() == "negative"), 0),
            "neutral": next((row[1] for row in sentiment_data if row[0].lower() == "neutral"), 0),
        }

        return jsonify(feedback_stats)

    except Exception as e:
        print("Error fetching feedback stats:", e)
        return jsonify({"error": "Error fetching feedback stats"}), 500



@app.route('/peak-hours-data', methods=['GET'])
def peak_hours_data():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT TO_CHAR(date, 'Day') AS day_of_week,
                           EXTRACT(HOUR FROM time) AS hour_of_day,
                           COUNT(*) AS order_count
                    FROM orders
                    WHERE EXTRACT(HOUR FROM time) BETWEEN 10 AND 21
                    GROUP BY day_of_week, hour_of_day
                    ORDER BY day_of_week, hour_of_day;
                """)
                data = cursor.fetchall()

        # Days and hours to structure the response
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        hours = list(range(10, 22))  # Peak hours: 10 AM to 9 PM

        # Initialize the dictionary for storing order counts
        order_data = {day: {hour: 0 for hour in hours} for day in days}

        # Populate order_data with query results
        for row in data:
            day_of_week = row[0].strip()  # Clean whitespace around day name
            hour_of_day = int(row[1])
            order_count = row[2]
            if day_of_week in order_data:
                order_data[day_of_week][hour_of_day] = order_count

        # Extract the highest order count for each day along with the corresponding hour
        highest_orders = {}
        for day in days:
            day_data = order_data[day]
            highest_hour = max(day_data, key=day_data.get)  # Hour with max orders
            highest_orders[day] = {
                "hour": highest_hour,
                "order_count": day_data[highest_hour]
            }

        # Return the highest order count for each day
        return jsonify({"highest_orders": highest_orders})

    except Exception as e:
        print("Error retrieving peak hours data:", e)
        return jsonify({"error": "Error retrieving data"}), 500


# Negative words that could appear in text
negative_words = ['bad', 'sad', 'angry', 'hate', 'worst', 'terrible', 'awful', 'dislike', 'sinful']

# Specific cases where negative words indicate positive sentiment
positive_with_negative_words = [
    "sinful",  # This could be used in a positive way when describing indulgence, like in desserts
    "bad"  # Sometimes 'bad' is used in a playful or indulgent context (e.g., "This is bad, but so good")
]

@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()  # Getting the JSON data from the request
    text = data.get('text')  # Extracting the text field from the JSON data
    
    # Analyzing sentiment using the VADER sentiment analyzer
    sentiment_score = analyzer.polarity_scores(text)
    compound_score = sentiment_score['compound']
    
    # Check for the presence of negative words, but allowing for positive sentiment context
    contains_negative_word = any(neg_word in text.lower() for neg_word in negative_words)
    
    # Special case for identifying positive sentiment with negative words
    sentiment_label = ''
    
    # Check if the text contains any words that should be considered as positive in context
    if contains_negative_word:
        if any(phrase in text.lower() for phrase in positive_with_negative_words):
            sentiment_label = 'positive sentiment with negative words'
        elif compound_score > 0.5:  # If VADER analysis indicates overall positive sentiment
            sentiment_label = 'positive sentiment with negative words'
        elif compound_score < -0.5:  # If the sentiment score is clearly negative
            sentiment_label = 'negative sentiment with negative words'
        else:
            sentiment_label = 'neutral sentiment with negative words'
    else:
        # If no negative words are detected, proceed with regular sentiment analysis
        if compound_score > 0.5:
            sentiment_label = 'positive'
        elif compound_score < -0.5:
            sentiment_label = 'negative'
        else:
            sentiment_label = 'neutral'

    # Returning the sentiment result as a JSON response
    return jsonify({
        'compound': compound_score,
        'sentiment': sentiment_label
    })



if __name__ == "__main__":
    app.run(debug=True, port=app_port)
