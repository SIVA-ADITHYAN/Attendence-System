import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np

# Create Dummy Image
img = np.zeros((100, 100, 3), dtype=np.uint8)

MODEL_PATH = "face_landmarker.task"
base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
landmarker_options = mp_vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=mp_vision.RunningMode.IMAGE,
    num_faces=1
)
face_landmarker = mp_vision.FaceLandmarker.create_from_options(landmarker_options)

# Use arbitrary face image if we can, or just mock result.
print("Imports and setup done.")
