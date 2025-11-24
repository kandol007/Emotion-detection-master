# Emotion Detection Web App

A real-time facial emotion detection application using Deep Learning, FastAPI, and Next.js.

## 🚀 Features

- **Real-time Emotion Detection**: Detects emotions from your webcam feed instantly.
- **Deep Learning Model**: Powered by a custom CNN model trained on the FER-2013 dataset.
- **Modern UI**: Built with Next.js 14, Tailwind CSS, and Framer Motion for a premium experience.
- **Interactive History**: Keeps a log of detected emotions with AI-generated responses.
- **Privacy Focused**: All processing happens on your device (or your private server), images are not stored.

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), OpenCV, TensorFlow/Keras
- **Model**: Convolutional Neural Network (CNN)

## 📦 Installation

### Prerequisites

- Python 3.9+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/kandol007/Emotion-detection-master.git
cd Emotion-detection-master
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
├── backend/
│   ├── main.py          # FastAPI entry point
│   ├── inference.py     # Emotion detection logic
│   └── model.h5         # Trained model weights
├── frontend/
│   ├── src/             # Next.js source code
│   └── ...
└── requirements.txt     # Python dependencies
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
