from backend.inference import EmotionDetector
import os

print(f"Checking model file...")
if os.path.exists('src/best_model.h5'):
    print("File exists.")
    try:
        detector = EmotionDetector(model_path='src/best_model.h5')
        if not detector.is_mock:
            print("SUCCESS: Model loaded successfully!")
        else:
            print("FAILURE: Model failed to load (fell back to mock).")
    except Exception as e:
        print(f"FAILURE: Exception during loading: {e}")
else:
    print("FAILURE: src/best_model.h5 does not exist.")
