from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from backend.inference import EmotionDetector
import uvicorn

app = FastAPI(title="Emotion Detection API")

# Allow CORS for frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://emotion-detection-master.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
detector = EmotionDetector()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Emotion Detection API is running"}

@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    image_bytes = await file.read()
    emotion = detector.predict(image_bytes)
    return {"emotion": emotion, "mock_mode": detector.is_mock}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
