#!/bin/bash

# Start the Flask app
echo "Starting Flask app on port 10000..."
/app/backend/flask/venv/bin/python /app/backend/flask/app.py &

# Start the Node.js app
echo "Starting Node.js app on port 5000..."
cd /app/backend/node && node server.js
