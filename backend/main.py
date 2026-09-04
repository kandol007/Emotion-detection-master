from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from backend.inference import EmotionDetector
import uvicorn

app = FastAPI(title="Emotion Detection API")

# Allow CORS for frontend (local Next.js dev and production deployments)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://emotion-detection-master.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector (picks Mini-Xception + YuNet automatically)
detector = EmotionDetector()

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Emotion Detection API is running",
        "model_type": detector.model_type,
        "face_detector": "YuNet + HaarCascade",
    }

@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = detector.predict_with_details(image_bytes)
    return {
        "emotion": result["emotion"],
        "confidence": result["confidence"],
        "face_detected": result["face_detected"],
        "probabilities": result.get("probabilities", {}),
        "bbox": result.get("bbox"),
        "model_type": result.get("model_type", detector.model_type),
        "mock_mode": detector.is_mock,
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
