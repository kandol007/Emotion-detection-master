# Dockerfile (use python:3.11 slim)
FROM python:3.11-slim

# Install system packages required by some ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    git \
    curl \
    ca-certificates \
    libhdf5-103 \
    libsndfile1 \
    libblas3 \
    liblapack3 \
    libatlas3-base \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to leverage layer caching
COPY requirements.txt /app/requirements.txt

# Upgrade pip/setuptools/wheel first and install requirements
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app code
COPY . /app

# Expose port (Render forwards $PORT, but keep 8000 here)
EXPOSE 8000

# Use env variable for PORT when starting in Render
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
