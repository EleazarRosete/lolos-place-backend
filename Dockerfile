# Backend Stage (Node.js + Python)
FROM python:3.10-slim AS backend
WORKDIR /app

# Install Node.js, npm, and supervisor
RUN apt-get update && apt-get install -y curl supervisor && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# Install system dependencies for Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    python3-dev

# Copy package files first to leverage Docker cache
COPY ./package*.json ./
RUN npm install

# Copy Python backend dependencies and install them
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project files
COPY . /app

# Expose the ports for Flask and Node.js
EXPOSE 5001 5000

# Copy supervisord.conf file for process management
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Default command to run both Node.js and Flask services using supervisord
CMD ["supervisord", "-n"]
