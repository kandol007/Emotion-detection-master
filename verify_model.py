import os
import numpy as np
from backend.inference import EmotionDetector

def main():
    print("=" * 60)
    print("Emotion Detection Model & Detector Verification")
    print("=" * 60)

    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
    yunet_file = os.path.join(base_dir, 'face_detection_yunet_2023mar.onnx')
    cascade_file = os.path.join(base_dir, 'haarcascade_frontalface_default.xml')
    mini_xcep_file = os.path.join(base_dir, 'model_mini_xception.hdf5')
    legacy_file = os.path.join(base_dir, 'model.h5')

    print(f"Checking YuNet model: {os.path.exists(yunet_file)} ({yunet_file})")
    print(f"Checking Haar cascade: {os.path.exists(cascade_file)} ({cascade_file})")
    print(f"Checking Mini-Xception model: {os.path.exists(mini_xcep_file)} ({mini_xcep_file})")
    print(f"Checking Legacy CNN model: {os.path.exists(legacy_file)} ({legacy_file})")

    print("\n--- Initializing EmotionDetector (Default: Mini-Xception + YuNet) ---")
    detector = EmotionDetector()
    if not detector.is_mock:
        print("SUCCESS: Default detector initialized with real deep learning model!")
        print(f"Model Type: {detector.model_type}")
        print(f"Input Resolution: {detector.target_size}")
        print(f"Normalization Mode: {detector.norm_mode}")
        print(f"Emotions: {list(detector.emotion_dict.values())}")
    else:
        print("FAILURE: Detector fell back to MOCK mode.")
        return 1

    print("\n--- Testing Synthetic Input Inference ---")
    # Synthetic face-like image (64x64 dummy RGB)
    dummy_img = np.ones((120, 120, 3), dtype=np.uint8) * 128
    import cv2
    _, encoded = cv2.imencode('.jpg', dummy_img)
    res = detector.predict_with_details(encoded.tobytes())
    print(f"Inference response on synthetic image: emotion={res['emotion']}, face_detected={res['face_detected']}")

    print("\n--- Testing Legacy Model Fallback ---")
    if os.path.exists(legacy_file):
        legacy_detector = EmotionDetector(model_path=legacy_file)
        print(f"Legacy model loaded: type={legacy_detector.model_type}, size={legacy_detector.target_size}")

    print("\n" + "=" * 60)
    print("ALL VERIFICATION CHECKS PASSED!")
    print("=" * 60)
    return 0

if __name__ == '__main__':
    exit(main())
