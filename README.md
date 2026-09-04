# Emotion Detection Web App

A high-accuracy, real-time facial emotion recognition application powered by Residual Mini-Xception deep learning, OpenCV face tracking, FastAPI, and Next.js.

## 🚀 Features

- **High-Accuracy Emotion Recognition**: Upgraded to a residual **Mini-Xception** neural network achieving benchmark accuracy (>66% on FER-2013, surpassing human baseline performance).
- **Dual Robust Face Detection**: Uses OpenCV's modern **YuNet DNN** detector and **Haar Cascade** with proportional offsets and temporal tracking to prevent drops from head tilt or motion.
- **Lighting & Contrast Robustness**: Implements adaptive histogram equalization (CLAHE) to maintain high detection accuracy under shadows, dim lighting, or screen glare.
- **Responsive Real-Time Feedback**: Smooth Exponential Moving Average (EMA) smoothing provides sub-second (<0.5s) expression response without lagging or stuck states.
- **Live Confidence & Probability Breakdown**: Frontend displays real-time confidence scores and probabilities across all 7 emotions (Angry, Disgusted, Fearful, Happy, Sad, Surprised, Neutral).
- **Face Tracking Box Overlay**: Live mirrored bounding box overlay on the webcam feed confirms active facial detection.
- **Privacy Focused**: All processing happens on your local device or server; images are analyzed in-memory and never stored.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (React), TypeScript, Tailwind CSS
- **Backend**: FastAPI, OpenCV, TensorFlow/Keras
- **Face Detectors**: OpenCV YuNet ONNX DNN + Haar Cascade Fallback
- **Models**: Residual Mini-Xception (64x64, 852 KB) with backwards compatibility for legacy CNN (48x48, 28 MB)

## 📦 Installation & Setup

### Prerequisites

- Python 3.11 (recommended for TensorFlow compatibility)
- Node.js 20+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/kandol007/Emotion-detection-master.git
cd Emotion-detection-master
```

### 2. Backend Setup (Virtual Environment)

```bash
# Create virtual environment with Python 3.11
python3.11 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify model and face detectors
python verify_model.py

# Run automated accuracy benchmark suite
python backend/test_accuracy.py

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verification & Health Checks

Run these commands to verify the system:

```bash
# Verify backend model loading & detector initialization
python verify_model.py

# Run emotion benchmark test (Neutral, Happy, and lighting invariance)
PYTHONPATH=. python backend/test_accuracy.py

# Build frontend
cd frontend && npm run build
```

## 📂 Project Structure

```
├── backend/
│   ├── main.py                             # FastAPI entry point & CORS configuration
│   ├── inference.py                        # Emotion detection engine (YuNet, Haar, Mini-Xception)
│   ├── model_mini_xception.h5             # High-accuracy Mini-Xception model (852 KB)
│   ├── model.h5                            # Legacy CNN model weights (28 MB)
│   ├── face_detection_yunet_2023mar.onnx   # OpenCV YuNet deep face detector (227 KB)
│   ├── haarcascade_frontalface_default.xml # Haar Cascade fallback detector
│   └── test_accuracy.py                    # Automated emotion recognition benchmark suite
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx                    # Main dashboard layout
│   │   └── components/
│   │       ├── WebcamCapture.tsx           # Webcam streaming & face tracking overlay
│   │       ├── EmotionDisplay.tsx          # Current emotion & confidence probability bars
│   │       └── EmotionHistory.tsx          # Real-time emotion log & interactive assistant
│   └── .env.local                          # Local backend API configuration
├── verify_model.py                         # Startup verification and diagnostics script
└── requirements.txt                        # Python dependencies
```

## 📄 License

This project is licensed under the MIT License.
