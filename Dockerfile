# Dockerfile - Python 3.11 (slim) tuned for TF / FastAPI
FROM python:3.11-slim

# Install system packages required by some ML packages
# Keep the list minimal and use packages available on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    git \
    curl \
    ca-certificates \
    libsndfile1 \
    libopenblas-dev \
    liblapack-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first for better layer caching
COPY requirements.txt /app/requirements.txt

# Upgrade pip & tooling then install wheel deps
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY . /app

# Expose port (Render provides $PORT at runtime)
EXPOSE 8000

# Start command uses $PORT if set
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
