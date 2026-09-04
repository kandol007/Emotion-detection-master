# Emotion Detection Local Run Guide

Use this file to run the full project locally: backend (FastAPI + TensorFlow) and frontend (Next.js).

## 1. Prerequisites

- macOS with Homebrew
- Python 3.11
- Node.js 20+
- npm

If Python 3.11 is not installed:

	brew install python@3.11

## 2. Go To Project Root

Run all setup from the project root first:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master

## 3. Backend One-Time Setup

Create a local virtual environment inside this project (not on Desktop root):

	/opt/homebrew/bin/python3.11 -m venv .venv

Activate it:

	source .venv/bin/activate

Install backend dependencies:

	python -m pip install --upgrade pip
	python -m pip install -r requirements.txt

## 4. Start Backend

From project root in Terminal 1:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master
	source .venv/bin/activate
	python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --app-dir .

Quick backend health check (new terminal):

	curl http://127.0.0.1:8000/

Expected response includes:

	{"status":"ok","message":"Emotion Detection API is running"}

## 5. Frontend One-Time Setup

In Terminal 2:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master/frontend
	npm install

Create local frontend env file so frontend calls local backend:

	printf "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000\n" > .env.local

## 6. Start Frontend

In Terminal 2:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master/frontend
	npm run dev

Open:

	http://localhost:3000

## 7. Validate Everything

Frontend checks:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master/frontend
	npm run lint
	npm run build
	npm audit --omit=dev

Backend security check:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master
	source .venv/bin/activate
	python -m pip install pip-audit
	python -m pip_audit

Optional predict API smoke test:

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master
	source .venv/bin/activate
	python - <<'PY'
	import numpy as np
	import cv2
	img = np.zeros((64, 64, 3), dtype=np.uint8)
	cv2.imwrite('/tmp/emotion_test.jpg', img)
	PY
	curl -X POST -F "file=@/tmp/emotion_test.jpg" http://127.0.0.1:8000/predict

## 8. Daily Run (After One-Time Setup)

Terminal 1 (backend):

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master
	source .venv/bin/activate
	python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --app-dir .

Terminal 2 (frontend):

	cd /Users/ritikkumar/Desktop/Projects/Emotion-detection-master/frontend
	npm run dev

## 9. Troubleshooting

- If TensorFlow fails to install, check Python version first:

	  python -V

  It should be Python 3.11.x inside .venv.

- If frontend cannot connect to backend, verify:

  1. Backend is running on 127.0.0.1:8000
  2. frontend/.env.local contains NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

- If camera is blocked, allow browser camera permissions and reload the page.

