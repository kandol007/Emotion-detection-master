import os
import numpy as np
import cv2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPooling2D, Input

class EmotionDetector:
    def __init__(self, model_path='backend/model.h5'):
        self.model_path = model_path
        self.emotion_dict = {0: "Angry", 1: "Disgusted", 2: "Fearful", 3: "Happy", 4: "Neutral", 5: "Sad", 6: "Surprised"}
        self.model = None
        self.is_mock = False
        
        if os.path.exists(self.model_path):
            print(f"Loading model from {self.model_path}...")
            try:
                self.model = self._build_model()
                self.model.load_weights(self.model_path)
                print("Model loaded successfully.")
            except Exception as e:
                print(f"Error loading model: {e}")
                print("Falling back to MOCK mode.")
                self.is_mock = True
        else:
            print(f"Warning: Model file not found at {self.model_path}. Running in MOCK mode.")
            self.is_mock = True

    def _build_model(self):
        # Architecture matching the Colab training script
        model = Sequential()
        # Use Input layer to avoid Keras warnings and match training config
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

    def predict(self, image_bytes):
        if self.is_mock:
            # Return a random emotion for testing purposes
            return np.random.choice(list(self.emotion_dict.values()))

        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            # Resize to 48x48
            resized_img = cv2.resize(img, (48, 48))

            # Normalize the image (crucial for model accuracy)
            resized_img = resized_img / 255.0
            
            # Expand dims to match model input (1, 48, 48, 1)
            cropped_img = np.expand_dims(np.expand_dims(resized_img, -1), 0)
            
            # Predict
            prediction = self.model.predict(cropped_img)
            maxindex = int(np.argmax(prediction))
            
            return self.emotion_dict[maxindex]
        except Exception as e:
            print(f"Prediction error: {e}")
            return "Error"
