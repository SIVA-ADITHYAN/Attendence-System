import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np

# Create Dummy Image
img = cv2.imread("lena.jpg")

MODEL_PATH = "face_landmarker.task"
base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
landmarker_options = mp_vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=mp_vision.RunningMode.IMAGE,
    num_faces=1
)
face_landmarker = mp_vision.FaceLandmarker.create_from_options(landmarker_options)

rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
h, w, _ = rgb_image.shape
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
result = face_landmarker.detect(mp_image)

if result.face_landmarks:
    landmarks = result.face_landmarks[0]
    # Try the extract function inline:
    KEY_LANDMARKS = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
        70, 63, 105, 66, 107,
        336, 296, 334, 293, 300,
        33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
        362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
        1, 2, 98, 327, 4, 5, 195, 197,
        6, 168, 8,
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
        78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
        78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
        78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
        10, 151, 9, 8,
        205, 425, 187, 411, 123, 352,
    ]
    _seen = set()
    pts = []
    print("Initial key len:", len(KEY_LANDMARKS))
    KEY_LANDMARKS_UNIQUE = []
    for idx in KEY_LANDMARKS:
        if idx not in _seen:
            _seen.add(idx)
            KEY_LANDMARKS_UNIQUE.append(idx)
    KEY_LANDMARKS = KEY_LANDMARKS_UNIQUE

    for idx in KEY_LANDMARKS:
        lm = landmarks[idx]
        pts.append([lm.x * w, lm.y * h, lm.z * w])
    
    print("pts len:", len(pts))
    # HERE IS THE LIKELY CRASH:
    pts = np.array(pts, dtype=np.float64)
    print("made array successfully", pts.shape)

    print("Success")
