# Base image for Node.js
FROM node:18

# Install Python, pip, and virtualenv
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Set working directory for the backend
WORKDIR /app/backend

# Copy the environment file
COPY .env ./

# Install Node.js dependencies
WORKDIR /app/backend/node
COPY node/package.json node/package-lock.json ./
RUN npm install

# Install Flask dependencies and set up a virtual environment
WORKDIR /app/backend/flask
COPY flask/requirements.txt ./

# Create a virtual environment for Flask
RUN python3 -m venv /app/backend/flask/venv

# Install the required Python packages inside the virtual environment
RUN /app/backend/flask/venv/bin/pip install --upgrade pip
RUN /app/backend/flask/venv/bin/pip install -r requirements.txt

# Ensure Flask is installed in the virtual environment (optional check)
RUN /app/backend/flask/venv/bin/pip show flask

# Copy the rest of the project files
WORKDIR /app/backend
COPY . .

# Expose Flask and Node.js ports
EXPOSE 5000 10000

# Use a shell script to run both Flask and Node.js
CMD ["./render-start.sh"]
