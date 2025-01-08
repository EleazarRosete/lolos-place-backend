# Use a Python image as the base
FROM python:3.10-slim AS backend

WORKDIR /app

# Install system dependencies for Python, Node.js, PostgreSQL client, and Supervisor
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    build-essential \
    libpq-dev \
    python3-dev \
    postgresql-client \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

# Create the /app/logs directory for logging
RUN mkdir -p /app/logs

# Install Node.js dependencies
COPY ./package*.json ./ 
RUN npm install

# Install Python dependencies
COPY requirements.txt ./ 
RUN pip install --no-cache-dir -r requirements.txt

# Copy all other application files
COPY . /app

# Expose the ports for Flask, Node.js, and PostgreSQL
EXPOSE 5001 5000 5432

# Copy supervisord.conf file for process management
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Default command to run both Node.js, Flask services, and PostgreSQL client using supervisord
CMD ["supervisord", "-n"]
