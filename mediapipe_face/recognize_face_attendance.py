# ============================================================
#  Real-Time Face Recognition Attendance — Local Camera Script
#  Engine  : MediaPipe FaceLandmarker (Tasks API)
#            468 landmarks → geometric embedding
#  Matching: Cosine Similarity  >=  SIMILARITY_THRESHOLD
#  Stability: Multi-Frame Fusion — must confirm for N consecutive
#             frames before marking attendance (no flickering)
# ============================================================

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import pymongo
import numpy as np
import os
import requests
from datetime import datetime
from collections import defaultdict, deque
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

# ── Config ────────────────────────────────────────────────────
MONGO_URI  = os.getenv("MONGODB_URI")
MONGO_DB   = os.getenv("MONGODB_DATABASE", "attendance_db")
API_BASE_URL = os.getenv("BACKEND_API_URL", "https://attendx-s9ju.onrender.com/api")

# ── Tuning knobs ──────────────────────────────────────────────
SIMILARITY_THRESHOLD  = 0.85   # cosine similarity to accept a match
CONFIRM_FRAMES_NEEDED = 5      # must match the SAME person N frames in a row
PROCESS_EVERY_N_FRAME = 2      # skip N-1 frames to keep CPU manageable

# ── MongoDB ───────────────────────────────────────────────────
client              = pymongo.MongoClient(MONGO_URI)
db                  = client[MONGO_DB]
students_collection = db["students"]

# ── MediaPipe FaceLandmarker (Tasks API) ─────────────────────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "face_landmarker.task")

print("[INFO] Loading MediaPipe FaceLandmarker model …")
base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
landmarker_options = mp_vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=mp_vision.RunningMode.IMAGE,   # IMAGE mode for per-frame processing
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
)
face_landmarker = mp_vision.FaceLandmarker.create_from_options(landmarker_options)
print("[INFO] Model ready ✓")

# ── Key landmark indices (same as app.py) ────────────────────
KEY_LANDMARKS = [
    # Jawline
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
    # Left eyebrow
    70, 63, 105, 66, 107,
    # Right eyebrow
    336, 296, 334, 293, 300,
    # Left eye
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
    # Right eye
    362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
    # Nose
    1, 2, 98, 327, 4, 5, 195, 197,
    # Nose bridge
    6, 168, 8,
    # Outer lips
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
    # Inner lips
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
    # Forehead
    10, 151, 9, 8,
    # Cheeks
    205, 425, 187, 411, 123, 352,
]

_seen = set()
KEY_LANDMARKS_UNIQUE = []
for idx in KEY_LANDMARKS:
    if idx not in _seen:
        _seen.add(idx)
        KEY_LANDMARKS_UNIQUE.append(idx)
KEY_LANDMARKS = KEY_LANDMARKS_UNIQUE


def extract_face_geometry(landmarks, img_w, img_h):
    """
    Extract a normalised geometric embedding from face mesh landmarks.
    """
    pts = []
    for idx in KEY_LANDMARKS:
        lm = landmarks[idx]
        pts.append([lm.x * img_w, lm.y * img_h, lm.z * img_w])

    pts = np.array(pts, dtype=np.float64)

    # Centre on nose tip
    nose_idx = KEY_LANDMARKS.index(1)
    centre = pts[nose_idx].copy()
    pts -= centre

    # Scale by inter-ocular distance
    def _find(idx):
        return KEY_LANDMARKS.index(idx)

    left_eye_centre  = (pts[_find(33)] + pts[_find(133)]) / 2.0
    right_eye_centre = (pts[_find(362)] + pts[_find(263)]) / 2.0
    iod = np.linalg.norm(right_eye_centre - left_eye_centre)
    if iod > 1e-6:
        pts /= iod

    # Pairwise distances between anchor points
    anchor_indices_in_key = [
        _find(33), _find(133), _find(362), _find(263),
        _find(1), _find(4), _find(5),
        _find(61), _find(291),
        _find(10), _find(152),
        _find(70), _find(300),
    ]
    anchor_pts = pts[anchor_indices_in_key]
    n_anchors = len(anchor_pts)
    pairwise = []
    for i in range(n_anchors):
        for j in range(i + 1, n_anchors):
            pairwise.append(np.linalg.norm(anchor_pts[i] - anchor_pts[j]))
    pairwise = np.array(pairwise, dtype=np.float64)

    embedding = np.concatenate([pts.flatten(), pairwise])

    norm = np.linalg.norm(embedding)
    if norm > 1e-8:
        embedding /= norm

    return embedding.astype(np.float32)


# ── FACEMESH connection indices for drawing ──────────────────
# These are the standard face mesh tesselation connections.
# MediaPipe Tasks API doesn't expose FACEMESH_TESSELATION directly,
# so we define the key contour connections for drawing.
FACE_OVAL_INDICES = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
]

LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33]
RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362]
LEFT_EYEBROW_INDICES = [70, 63, 105, 66, 107]
RIGHT_EYEBROW_INDICES = [336, 296, 334, 293, 300]
LIPS_OUTER_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 61]
LIPS_INNER_INDICES = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 78]
NOSE_INDICES = [1, 2, 98, 327, 4, 5, 195, 197, 1]


def draw_face_mesh(frame, landmarks, w, h):
    """Draw face mesh contours on the frame."""
    def draw_polyline(indices, color, thickness=1):
        pts = []
        for idx in indices:
            lm = landmarks[idx]
            pts.append((int(lm.x * w), int(lm.y * h)))
        for i in range(len(pts) - 1):
            cv2.line(frame, pts[i], pts[i + 1], color, thickness)

    # Draw contours with different colors
    draw_polyline(FACE_OVAL_INDICES, (200, 200, 200), 1)      # Grey face oval
    draw_polyline(LEFT_EYE_INDICES, (0, 200, 200), 1)         # Cyan left eye
    draw_polyline(RIGHT_EYE_INDICES, (0, 200, 200), 1)        # Cyan right eye
    draw_polyline(LEFT_EYEBROW_INDICES, (200, 200, 0), 1)     # Yellow left brow
    draw_polyline(RIGHT_EYEBROW_INDICES, (200, 200, 0), 1)    # Yellow right brow
    draw_polyline(LIPS_OUTER_INDICES, (0, 100, 255), 1)       # Orange outer lips
    draw_polyline(LIPS_INNER_INDICES, (0, 50, 200), 1)        # Dark orange inner lips
    draw_polyline(NOSE_INDICES, (0, 255, 0), 1)               # Green nose

    # Draw key landmark dots
    for idx in KEY_LANDMARKS:
        lm = landmarks[idx]
        x, y = int(lm.x * w), int(lm.y * h)
        cv2.circle(frame, (x, y), 1, (0, 255, 128), -1)


# ── Database helpers ──────────────────────────────────────────

def get_registered_students():
    """Fetch all face-registered students → (embeddings list, metadata list)."""
    students = list(students_collection.find({"faceRegistered": True}))
    known_embeddings = []
    known_metadata   = []

    for student in students:
        emb_raw = student.get("faceEmbedding")
        if emb_raw:
            # Only load embeddings that match the new model
            if student.get("embeddingModel") != "mediapipe_face_landmarker_geometric":
                continue

            emb = np.array(emb_raw, dtype=np.float32)
            known_embeddings.append(emb)
            known_metadata.append(student)

    print(f"[INFO] Loaded {len(known_embeddings)} registered face(s) from DB.")
    return known_embeddings, known_metadata


def cosine_match(query_emb, known_embeddings, threshold=SIMILARITY_THRESHOLD):
    """
    Return (student_index, score) if best cosine similarity >= threshold,
    else return (-1, score).
    """
    if not known_embeddings:
        return -1, 0.0

    db_matrix  = np.array(known_embeddings, dtype=np.float32)
    query_row  = query_emb.reshape(1, -1)

    # Handle dimension mismatch
    if query_row.shape[1] != db_matrix.shape[1]:
        max_dim = max(query_row.shape[1], db_matrix.shape[1])
        if query_row.shape[1] < max_dim:
            query_row = np.pad(query_row, ((0, 0), (0, max_dim - query_row.shape[1])))
        if db_matrix.shape[1] < max_dim:
            db_matrix = np.pad(db_matrix, ((0, 0), (0, max_dim - db_matrix.shape[1])))

    scores     = cosine_similarity(query_row, db_matrix)[0]
    best_idx   = int(np.argmax(scores))
    best_score = float(scores[best_idx])

    return (best_idx, best_score) if best_score >= threshold else (-1, best_score)


# ── Attendance helper ─────────────────────────────────────────

def mark_attendance_api(student):
    """POST attendance to Spring Boot backend."""
    student_id = str(student.get("_id"))
    date_str   = datetime.now().strftime("%Y-%m-%d")
    time_str   = datetime.now().strftime("%H:%M:%S")
    status     = "PRESENT"

    batch_start = student.get("batchStartTime")
    if batch_start:
        try:
            if isinstance(batch_start, str):
                batch_time = datetime.strptime(batch_start, "%H:%M:%S").time()
            elif isinstance(batch_start, dict):
                batch_time = datetime.now().replace(
                    hour=batch_start.get("hour", 0),
                    minute=batch_start.get("minute", 0),
                    second=batch_start.get("second", 0),
                ).time()
            else:
                batch_time = None

            if batch_time and datetime.now().time() > batch_time:
                status = "LATE"
        except Exception:
            pass

    payload = {
        "studentId":  student_id,
        "tutorId":    student.get("tutorId"),
        "date":       date_str,
        "status":     status,
        "checkInTime": time_str,
        "remarks":    "Automated Face Recognition (MediaPipe)",
    }

    try:
        resp = requests.post(f"{API_BASE_URL}/attendance", json=payload, timeout=5)
        if resp.status_code == 201:
            print(f"[✓] Attendance → {student.get('studentName')} ({status})")
            return True
        else:
            print(f"[✗] API error for {student.get('studentName')}: {resp.text}")
    except Exception as e:
        print(f"[✗] Network error: {e}")

    return False


# ── Multi-Frame Fusion tracker ────────────────────────────────

class FusionTracker:
    """
    Implements 'burst fusion' stability logic.
    Only fires attendance when the SAME student_id is confirmed
    CONFIRM_FRAMES_NEEDED frames in a row.
    """

    def __init__(self, window=CONFIRM_FRAMES_NEEDED):
        self.window   = window
        self.streaks  = defaultdict(lambda: deque(maxlen=window))
        self.emb_buf  = defaultdict(lambda: deque(maxlen=window))

    def _face_key(self, bbox):
        """Bucket a face by its rough screen region (grid of 4×4)."""
        x1, y1, x2, y2 = bbox
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        return (cx // 160, cy // 120)

    def update(self, bbox, student_id, embedding):
        key = self._face_key(bbox)
        self.streaks[key].append(student_id)
        self.emb_buf[key].append(embedding)

        streak = list(self.streaks[key])
        if len(streak) == self.window and all(s == student_id for s in streak):
            self.streaks[key].clear()
            self.emb_buf[key].clear()
            return student_id
        return None

    def unknown(self, bbox):
        key = self._face_key(bbox)
        self.streaks[key].clear()
        self.emb_buf[key].clear()


# ── Main loop ─────────────────────────────────────────────────

def mark_attendance():
    known_embeddings, known_metadata = get_registered_students()

    if not known_embeddings:
        print("[ERROR] No registered faces found. Register students first.")
        return

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        print("[ERROR] Cannot open camera.")
        return

    marked_today = set()
    tracker      = FusionTracker()
    frame_count  = 0

    display_faces = []
    draw_mesh_flag = True  # toggle face mesh overlay

    print("[INFO] Camera started. Press 'q' to quit, 'r' to reload DB, 'm' to toggle mesh.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Frame read failed, retrying …")
            continue

        frame_count += 1
        h, w, _ = frame.shape

        if frame_count % PROCESS_EVERY_N_FRAME == 0:
            display_faces = []
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Detect face landmarks using Tasks API
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            result = face_landmarker.detect(mp_image)

            if result.face_landmarks:
                face_landmarks = result.face_landmarks[0]
                embedding = extract_face_geometry(face_landmarks, w, h)

                # Compute bounding box from mesh landmarks
                xs = [lm.x * w for lm in face_landmarks]
                ys = [lm.y * h for lm in face_landmarks]
                x1, y1 = int(min(xs)) - 10, int(min(ys)) - 10
                x2, y2 = int(max(xs)) + 10, int(max(ys)) + 10
                bbox = np.array([max(0, x1), max(0, y1), min(w, x2), min(h, y2)])

                best_idx, score = cosine_match(embedding, known_embeddings)

                if best_idx >= 0:
                    student    = known_metadata[best_idx]
                    student_id = str(student.get("_id"))
                    name       = student.get("studentName", "Unknown")

                    confirmed = tracker.update(bbox, student_id, embedding)
                    if confirmed and student_id not in marked_today:
                        if mark_attendance_api(student):
                            marked_today.add(student_id)

                    label = f"{name} ({score:.2f})"
                    color = (0, 220, 0)   # green
                else:
                    tracker.unknown(bbox)
                    label = f"Unknown ({score:.2f})"
                    color = (0, 0, 220)   # red

                display_faces.append((bbox, label, color, face_landmarks if draw_mesh_flag else None))

        # ── Draw bounding boxes and face mesh ─────────────────
        for item in display_faces:
            bbox, label, color, mesh_landmarks = item
            x1, y1, x2, y2 = bbox

            # Draw face mesh if enabled
            if mesh_landmarks:
                draw_face_mesh(frame, mesh_landmarks, w, h)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            # Label background
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_DUPLEX, 0.65, 1)
            cv2.rectangle(frame, (x1, y2 - th - 8), (x1 + tw + 4, y2), color, cv2.FILLED)
            cv2.putText(frame, label, (x1 + 2, y2 - 4),
                        cv2.FONT_HERSHEY_DUPLEX, 0.65, (255, 255, 255), 1)

        # HUD
        cv2.putText(frame, f"Marked today: {len(marked_today)}  |  DB: {len(known_embeddings)} students",
                    (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
        cv2.putText(frame, f"Threshold: {SIMILARITY_THRESHOLD}  Confirm: {CONFIRM_FRAMES_NEEDED} frames  |  MediaPipe FaceLandmarker",
                    (10, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)

        cv2.imshow("Face Recognition Attendance  [MediaPipe]", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("r"):
            known_embeddings, known_metadata = get_registered_students()
            print("[INFO] DB reloaded.")
        elif key == ord("m"):
            draw_mesh_flag = not draw_mesh_flag
            print(f"[INFO] Face mesh overlay: {'ON' if draw_mesh_flag else 'OFF'}")

    cap.release()
    cv2.destroyAllWindows()
    print(f"\n[DONE] Session ended. Marked {len(marked_today)} student(s).")


if __name__ == "__main__":
    mark_attendance()
