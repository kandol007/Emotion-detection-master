import os
from threading import Lock
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPooling2D, Input

class EmotionDetector:
    def __init__(
        self,
        model_path=None,
        cascade_path=None,
        yunet_path=None,
        ema_alpha=0.55,
        max_missed_frames=2,
    ):
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # Pick best available model: prefer high-accuracy Mini-Xception, fallback to model.h5
        if model_path is None:
            mini_xcep_h5 = os.path.join(base_dir, 'model_mini_xception.h5')
            mini_xcep_hdf5 = os.path.join(base_dir, 'model_mini_xception.hdf5')
            legacy_path = os.path.join(base_dir, 'model.h5')
            if os.path.exists(mini_xcep_h5):
                model_path = mini_xcep_h5
            elif os.path.exists(mini_xcep_hdf5):
                model_path = mini_xcep_hdf5
            elif os.path.exists(legacy_path):
                model_path = legacy_path
            else:
                model_path = legacy_path

        if cascade_path is None:
            cascade_path = os.path.join(base_dir, 'haarcascade_frontalface_default.xml')

        if yunet_path is None:
            yunet_path = os.path.join(base_dir, 'face_detection_yunet_2023mar.onnx')

        self.model_path = model_path
        self.cascade_path = cascade_path
        self.yunet_path = yunet_path
        self.ema_alpha = float(ema_alpha)
        self.max_missed_frames = int(max_missed_frames)

        self.model = None
        self.is_mock = False
        self.model_type = "unknown"
        self.target_size = (64, 64)
        self.norm_mode = "v2"  # 'v2' for [-1, 1], 'v1' for [0, 1]

        # Emotion label mappings:
        # Mini-Xception (canonical FER-2013): 0: Angry, 1: Disgusted, 2: Fearful, 3: Happy, 4: Sad, 5: Surprised, 6: Neutral
        # Legacy CNN (alphabetical directory): 0: Angry, 1: Disgusted, 2: Fearful, 3: Happy, 4: Neutral, 5: Sad, 6: Surprised
        self.emotion_dict = {
            0: "Angry",
            1: "Disgusted",
            2: "Fearful",
            3: "Happy",
            4: "Sad",
            5: "Surprised",
            6: "Neutral",
        }

        # Tracking and temporal smoothing state
        self.last_bbox = None
        self.missed_frames = 0
        self.ema_probs = None
        self.state_lock = Lock()

        # Initialize Haar cascade detector (primary for FER-aligned crops)
        self.face_cascade = None
        if self.cascade_path and os.path.exists(self.cascade_path):
            cascade = cv2.CascadeClassifier(self.cascade_path)
            if not cascade.empty():
                self.face_cascade = cascade
                print(f"Loaded Haar cascade face detector from {self.cascade_path}")
            else:
                print(f"Warning: Failed to initialize face cascade from {self.cascade_path}.")

        # Initialize modern YuNet detector (robust fallback for tilted/low-light faces)
        self.yunet_detector = None
        if self.yunet_path and os.path.exists(self.yunet_path) and hasattr(cv2, 'FaceDetectorYN'):
            try:
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    self.yunet_path,
                    "",
                    (320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000,
                )
                print(f"Loaded modern YuNet face detector from {self.yunet_path}")
            except Exception as e:
                print(f"Warning: Failed to load YuNet detector: {e}")
                self.yunet_detector = None

        # Initialize emotion recognition model
        self._load_emotion_model()

    def _build_legacy_model(self):
        model = Sequential()
        model.add(Input(shape=(48, 48, 1)))
        model.add(Conv2D(32, kernel_size=(3, 3), activation='relu'))
        model.add(Conv2D(64, kernel_size=(3, 3), activation='relu'))
        model.add(MaxPooling2D(pool_size=(2, 2)))
        model.add(Dropout(0.25))

        model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
        model.add(MaxPooling2D(pool_size=(2, 2)))
        model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
        model.add(MaxPooling2D(pool_size=(2, 2)))
        model.add(Dropout(0.25))

        model.add(Flatten())
        model.add(Dense(1024, activation='relu'))
        model.add(Dropout(0.5))
        model.add(Dense(7, activation='softmax'))
        return model

    def _load_emotion_model(self):
        if not os.path.exists(self.model_path):
            print(f"Warning: Model file not found at {self.model_path}. Running in MOCK mode.")
            self.is_mock = True
            return

        print(f"Loading emotion model from {self.model_path}...")
        try:
            self.model = load_model(self.model_path, compile=False)
            print("Model loaded successfully via load_model.")
        except Exception as e:
            print(f"load_model failed ({e}), attempting legacy architecture build...")
            try:
                self.model = self._build_legacy_model()
                self.model.load_weights(self.model_path)
                print("Legacy model loaded successfully via load_weights.")
            except Exception as e2:
                print(f"Error loading model weights: {e2}")
                print("Falling back to MOCK mode.")
                self.is_mock = True
                return

        input_shape = getattr(self.model, 'input_shape', None)
        if input_shape is not None and len(input_shape) == 4:
            h, w = input_shape[1], input_shape[2]
            self.target_size = (w, h)
            if h == 64 and w == 64:
                self.model_type = "mini_xception"
                self.norm_mode = "v2"
                self.emotion_dict = {
                    0: "Angry",
                    1: "Disgusted",
                    2: "Fearful",
                    3: "Happy",
                    4: "Sad",
                    5: "Surprised",
                    6: "Neutral",
                }
            else:
                self.model_type = "legacy_cnn"
                self.norm_mode = "v1"
                self.emotion_dict = {
                    0: "Angry",
                    1: "Disgusted",
                    2: "Fearful",
                    3: "Happy",
                    4: "Neutral",
                    5: "Sad",
                    6: "Surprised",
                }
        else:
            self.target_size = (48, 48)
            self.norm_mode = "v1"
            self.model_type = "legacy_cnn"

        print(f"Initialized model type: {self.model_type} (input={self.target_size}, norm={self.norm_mode})")

    def _reset_tracking(self):
        with self.state_lock:
            self.last_bbox = None
            self.missed_frames = 0
            self.ema_probs = None

    def _detect_face(self, img_bgr):
        h, w = img_bgr.shape[:2]
        detected_bbox = None
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Primary: Haar Cascade (matches exact FER-2013 face bounding geometry)
        if self.face_cascade is not None:
            try:
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.2,
                    minNeighbors=5,
                    minSize=(50, 50),
                )
                if len(faces) == 0:
                    # Fallback with relaxed sensitivity
                    faces = self.face_cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,
                        minNeighbors=3,
                        minSize=(40, 40),
                    )
                if len(faces) > 0:
                    bx, by, bw, bh = max(faces, key=lambda f: f[2] * f[3])
                    # Expand proportionally for optimal FER facial context (hairline to chin)
                    x_off = int(0.08 * bw)
                    y_off = int(0.12 * bh)
                    x1 = max(0, bx - x_off)
                    y1 = max(0, by - y_off)
                    bw_adj = min(w - x1, bw + 2 * x_off)
                    bh_adj = min(h - y1, bh + 2 * y_off)
                    detected_bbox = (int(x1), int(y1), int(bw_adj), int(bh_adj))
            except Exception as e:
                print(f"Haar cascade detection error: {e}")

        # 2. Secondary fallback: Modern YuNet DNN (detects tilted, occluded, or low-light faces)
        if detected_bbox is None and self.yunet_detector is not None:
            try:
                self.yunet_detector.setInputSize((w, h))
                _, faces = self.yunet_detector.detect(img_bgr)
                if faces is not None and len(faces) > 0:
                    best_face = max(faces, key=lambda f: f[2] * f[3])
                    yx, yy, yw, yh = best_face[:4]
                    # Scale YuNet's landmark-tight box (1.35x) to match Haar's full facial boundary
                    cx, cy = yx + yw / 2.0, yy + yh / 2.0
                    nw, nh = yw * 1.35, yh * 1.35
                    x1 = int(max(0, cx - nw / 2.0))
                    y1 = int(max(0, cy - nh / 2.0))
                    bw_adj = int(min(w - x1, nw))
                    bh_adj = int(min(h - y1, nh))
                    detected_bbox = (x1, y1, bw_adj, bh_adj)
            except Exception as e:
                print(f"YuNet detection error: {e}")

        # 3. Temporal tracking buffer (smooths over 1-2 dropped frames during head motion)
        with self.state_lock:
            if detected_bbox is not None:
                self.last_bbox = detected_bbox
                self.missed_frames = 0
                return detected_bbox, True
            else:
                if self.last_bbox is not None and self.missed_frames < self.max_missed_frames:
                    self.missed_frames += 1
                    return self.last_bbox, True
                else:
                    self.last_bbox = None
                    self.missed_frames = 0
                    self.ema_probs = None
                    return None, False

    def _preprocess_face(self, img_bgr, bbox):
        img_h, img_w = img_bgr.shape[:2]
        x, y, w, h = bbox

        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(img_w, x + w)
        y2 = min(img_h, y + h)

        face_roi = img_bgr[y1:y2, x1:x2]
        if face_roi.size == 0:
            return None

        # Convert to grayscale
        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)

        # Resize to model target size
        resized = cv2.resize(gray_roi, self.target_size, interpolation=cv2.INTER_AREA)

        # Normalize based on model requirements
        if self.norm_mode == "v2":
            # Scale to [-1.0, 1.0] (Mini-Xception format)
            normalized = (resized.astype("float32") / 255.0 - 0.5) * 2.0
        else:
            # Scale to [0.0, 1.0] (Legacy CNN format)
            normalized = resized.astype("float32") / 255.0

        model_input = np.expand_dims(np.expand_dims(normalized, -1), 0)
        return model_input

    def _smooth_prediction(self, probs):
        with self.state_lock:
            if self.ema_probs is None:
                self.ema_probs = probs
            else:
                self.ema_probs = (self.ema_alpha * probs) + ((1.0 - self.ema_alpha) * self.ema_probs)
            return self.ema_probs.copy()

    def predict_with_details(self, image_bytes):
        if self.is_mock:
            emotions = list(self.emotion_dict.values())
            random_emotion = np.random.choice(emotions)
            return {
                "emotion": random_emotion,
                "confidence": 0.0,
                "face_detected": False,
                "probabilities": {e: 0.14 for e in emotions},
                "bbox": None,
                "model_type": "mock",
            }

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img_bgr is None:
                raise ValueError("Invalid or unsupported image format")

            bbox, face_detected = self._detect_face(img_bgr)

            if not face_detected or bbox is None:
                return {
                    "emotion": "Neutral",
                    "confidence": 0.0,
                    "face_detected": False,
                    "probabilities": {},
                    "bbox": None,
                    "model_type": self.model_type,
                }

            model_input = self._preprocess_face(img_bgr, bbox)
            if model_input is None:
                return {
                    "emotion": "Neutral",
                    "confidence": 0.0,
                    "face_detected": False,
                    "probabilities": {},
                    "bbox": None,
                    "model_type": self.model_type,
                }

            raw_preds = self.model.predict(model_input, verbose=0)[0]
            smoothed_preds = self._smooth_prediction(raw_preds)

            max_idx = int(np.argmax(smoothed_preds))
            confidence = float(smoothed_preds[max_idx])
            winning_emotion = self.emotion_dict[max_idx]

            # Build full probability dictionary
            probs_dict = {
                self.emotion_dict[i]: round(float(smoothed_preds[i]), 4)
                for i in range(len(smoothed_preds))
            }

            return {
                "emotion": winning_emotion,
                "confidence": round(confidence, 4),
                "face_detected": True,
                "probabilities": probs_dict,
                "bbox": [bbox[0], bbox[1], bbox[2], bbox[3]],
                "model_type": self.model_type,
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                "emotion": "Error",
                "confidence": 0.0,
                "face_detected": False,
                "probabilities": {},
                "bbox": None,
                "model_type": self.model_type,
            }

    def predict(self, image_bytes):
        details = self.predict_with_details(image_bytes)
        return details["emotion"]
