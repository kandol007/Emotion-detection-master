import urllib.request
import cv2
import numpy as np
from backend.inference import EmotionDetector

def download_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=15).read()
    return data

def test_emotion_accuracy():
    print("=" * 60)
    print("Testing Emotion Detection Accuracy on Standard Benchmark Faces")
    print("=" * 60)

    detector = EmotionDetector(ema_alpha=0.9)  # Higher alpha for single-shot testing

    # 1. Test Neutral Face (Lena)
    url_neutral = 'https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg'
    print("\n[1] Testing Neutral Expression (Lena standard benchmark image)...")
    try:
        data_neutral = download_image(url_neutral)
        res_neutral = detector.predict_with_details(data_neutral)
        print(f"Result: {res_neutral['emotion']} (Confidence: {res_neutral['confidence']*100:.1f}%)")
        print(f"Face Detected: {res_neutral['face_detected']}, BBox: {res_neutral['bbox']}")
        print(f"Probabilities: {res_neutral['probabilities']}")
        assert res_neutral['face_detected'], "Face must be detected on Lena"
        assert res_neutral['emotion'] in ['Neutral', 'Sad'], f"Expected Neutral/calm expression, got {res_neutral['emotion']}"
        print("PASS: Neutral expression successfully recognized!")
    except Exception as e:
        print(f"FAIL on Neutral test: {e}")
        raise

    # 2. Test Happy / Smiling Face
    detector._reset_tracking()
    url_happy = 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg'
    print("\n[2] Testing Happy Expression (Smiling face image)...")
    try:
        data_happy = download_image(url_happy)
        res_happy = detector.predict_with_details(data_happy)
        print(f"Result: {res_happy['emotion']} (Confidence: {res_happy['confidence']*100:.1f}%)")
        print(f"Face Detected: {res_happy['face_detected']}, BBox: {res_happy['bbox']}")
        print(f"Probabilities: {res_happy['probabilities']}")
        assert res_happy['face_detected'], "Face must be detected on smiling face"
        assert res_happy['emotion'] == 'Happy', f"Expected Happy, got {res_happy['emotion']}"
        assert res_happy['confidence'] > 0.80, f"Happy confidence should be high (>80%), got {res_happy['confidence']}"
        print("PASS: Happy expression recognized with high confidence!")
    except Exception as e:
        print(f"FAIL on Happy test: {e}")
        raise

    # 3. Test Lighting Invariance with CLAHE (Dimmed / shadowed test)
    detector._reset_tracking()
    print("\n[3] Testing Lighting Invariance (Artificially dimmed 40% illumination)...")
    img_bgr = cv2.imdecode(np.frombuffer(data_happy, np.uint8), cv2.IMREAD_COLOR)
    dimmed_bgr = (img_bgr * 0.4).astype(np.uint8)
    _, dimmed_bytes = cv2.imencode('.jpg', dimmed_bgr)
    res_dimmed = detector.predict_with_details(dimmed_bytes.tobytes())
    print(f"Result on dimmed image: {res_dimmed['emotion']} (Confidence: {res_dimmed['confidence']*100:.1f}%)")
    assert res_dimmed['face_detected'], "Face should still be detected in low light with YuNet"
    assert res_dimmed['emotion'] == 'Happy', f"Expected Happy even in low light, got {res_dimmed['emotion']}"
    print("PASS: CLAHE illumination normalization preserved detection accuracy!")

    print("\n" + "=" * 60)
    print("ALL ACCURACY & BENCHMARK TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    test_emotion_accuracy()
