#!/bin/bash

# Start Flask in the background using the virtual environment's python interpreter
echo "Starting Flask on port 10000..."
/app/backend/flask/venv/bin/python /app/backend/flask/app.py &

# Start Node.js app
echo "Starting Node.js on port 5000..."
npm start --prefix /app/backend/node
