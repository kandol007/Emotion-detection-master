# Dockerfile — use official TF image (CPU) to avoid tensorflow-intel issues
FROM tensorflow/tensorflow:2.15.0

# Install minimal system packages needed by some Python packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    ca-certificates \
    pkg-config \
    libsndfile1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt /app/requirements.txt

# Remove any tensorflow-related lines from requirements so we don't attempt to reinstall TF
RUN sed -i '/tensorflow/Id' /app/requirements.txt || true

# Upgrade pip/tooling and install remaining requirements
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY . /app

# Expose port; Render provides $PORT at runtime
EXPOSE 8000

# Simple healthcheck (requires curl, which we installed above)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Start Uvicorn (uses $PORT if set)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]
