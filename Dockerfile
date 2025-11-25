# Dockerfile — base on official TF image (CPU) to avoid tensorflow-intel issues
FROM tensorflow/tensorflow:2.15.0

# (Optional) install system tools needed for other deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git curl ca-certificates pkg-config libsndfile1 libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements but *skip* tensorflow packages to avoid reinstalling TF
# (we'll still install the rest)
COPY requirements.txt /app/requirements.txt

# Remove tensorflow lines at install time so pip doesn't try to reinstall
RUN python - <<'PY'\n\
    from pathlib import Path\n\
    p = Path('/app/requirements.txt')\n\
    lines = [l for l in p.read_text().splitlines() if 'tensorflow' not in l.lower()]\n\
    p.write_text('\\n'.join(lines) + '\\n')\n\
    PY

RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app code
COPY . /app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
