# ============================================================
#  Face Recognition Attendance System - Flask API
#  Engine  : MediaPipe FaceLandmarker (Tasks API)
#            468 landmarks → geometric embedding
#  Matching: Cosine Similarity  (threshold >= configurable)
#  Fusion  : Optional multi-frame averaged embedding endpoint
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import pymongo
import numpy as np
import os
import base64
from dotenv import load_dotenv
from bson.objectid import ObjectId
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

app = Flask(__name__)

# ── CORS — explicit origins to fix preflight failures on Render ──
CORS(app, resources={r"/*": {
    "origins": [
        "https://attendx-zeta.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True,
}})

@app.after_request
def add_cors_headers(response):
    """Ensure CORS headers are present on every response (incl. preflight)."""
    origin = request.headers.get("Origin", "")
    allowed = [
        "https://attendx-zeta.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    if origin in allowed:
        response.headers["Access-Control-Allow-Origin"]      = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"]     = "Content-Type, Authorization"
    return response

@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    """Handle all OPTIONS preflight requests explicitly."""
    response = app.make_default_options_response()
    return add_cors_headers(response)

# ── MongoDB ──────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGODB_URI")
MONGO_DB  = os.getenv("MONGODB_DATABASE", "attendance_db")

client             = pymongo.MongoClient(MONGO_URI)
db                 = client[MONGO_DB]
students_collection = db["students"]

# ── MediaPipe FaceLandmarker (Tasks API) ─────────────────────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "face_landmarker.task")

base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
landmarker_options = mp_vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=mp_vision.RunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
)
face_landmarker = mp_vision.FaceLandmarker.create_from_options(landmarker_options)

# Cosine similarity threshold
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))


# ── Key landmark indices for geometric feature extraction ────
KEY_LANDMARKS = [
    # Jawline (contour)
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
    # Forehead / top of head
    10, 151, 9, 8,
    # Cheek points
    205, 425, 187, 411, 123, 352,
]

# Remove duplicates while preserving order
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

    Strategy:
    1. Extract (x, y, z) for all KEY_LANDMARKS
    2. Centre on the nose tip (landmark 1)
    3. Scale by the inter-ocular distance
    4. Append pairwise distances between anchor points
    5. L2-normalise
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

    # Pairwise distances between critical anchor points
    anchor_indices_in_key = [
        _find(33), _find(133), _find(362), _find(263),  # eyes
        _find(1), _find(4), _find(5),                    # nose
        _find(61), _find(291),                           # mouth corners
        _find(10), _find(152),                           # top and bottom of face
        _find(70), _find(300),                           # eyebrow outer
    ]
    anchor_pts = pts[anchor_indices_in_key]
    n_anchors = len(anchor_pts)
    pairwise = []
    for i in range(n_anchors):
        for j in range(i + 1, n_anchors):
            pairwise.append(np.linalg.norm(anchor_pts[i] - anchor_pts[j]))
    pairwise = np.array(pairwise, dtype=np.float64)

    # Concatenate: flattened landmarks + pairwise distances
    embedding = np.concatenate([pts.flatten(), pairwise])

    # L2 normalise
    norm = np.linalg.norm(embedding)
    if norm > 1e-8:
        embedding /= norm

    return embedding.astype(np.float32)


# ── Helpers ───────────────────────────────────────────────────

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode a base64 image string → BGR numpy array (OpenCV format)."""
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    img_data = base64.b64decode(base64_string)
    nparr    = np.frombuffer(img_data, np.uint8)
    img      = cv2.imdecode(nparr, cv2.IMREAD_COLOR)   # BGR
    return img


def get_mediapipe_embedding(bgr_image: np.ndarray):
    """
    Detect a face with MediaPipe FaceLandmarker, extract geometric embedding.
    Returns (embedding_array, error_string).
    """
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb_image.shape

    # Convert to MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    result = face_landmarker.detect(mp_image)

    if not result.face_landmarks:
        return None, "No face detected in the image"

    if len(result.face_landmarks) > 1:
        return None, "Multiple faces detected — please ensure only one face is visible"

    face_landmarks = result.face_landmarks[0]  # list of NormalizedLandmark
    embedding = extract_face_geometry(face_landmarks, w, h)

    return embedding, None


def load_registered_students():
    """Load all face-registered students from MongoDB."""
    students = list(students_collection.find({"faceRegistered": True}))
    known_embeddings = []
    known_metadata   = []

    for student in students:
        if "faceEmbedding" in student and student["faceEmbedding"]:
            # Only load embeddings that match the new model
            if student.get("embeddingModel") != "mediapipe_face_landmarker_geometric":
                continue
            
            emb = np.array(student["faceEmbedding"], dtype=np.float32)
            known_embeddings.append(emb)
            known_metadata.append({
                "id":             str(student.get("_id")),
                "studentName":    student.get("studentName"),
                "batchStartTime": student.get("batchStartTime"),
                "tutorId":        student.get("tutorId"),
            })

    return known_embeddings, known_metadata


def cosine_match(query_emb: np.ndarray, known_embeddings: list, threshold: float):
    """
    Compare query embedding against all known embeddings using cosine similarity.
    Returns (best_index, best_score) or (-1, 0.0) if no match above threshold.
    """
    if not known_embeddings:
        return -1, 0.0

    db_matrix   = np.array(known_embeddings, dtype=np.float32)
    query_row   = query_emb.reshape(1, -1)

    # Handle dimension mismatch
    if query_row.shape[1] != db_matrix.shape[1]:
        max_dim = max(query_row.shape[1], db_matrix.shape[1])
        if query_row.shape[1] < max_dim:
            query_row = np.pad(query_row, ((0, 0), (0, max_dim - query_row.shape[1])))
        if db_matrix.shape[1] < max_dim:
            db_matrix = np.pad(db_matrix, ((0, 0), (0, max_dim - db_matrix.shape[1])))

    scores      = cosine_similarity(query_row, db_matrix)[0]
    best_index  = int(np.argmax(scores))
    best_score  = float(scores[best_index])

    if best_score >= threshold:
        return best_index, best_score
    return -1, best_score


# ── Routes ────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "mediapipe_face_landmarker_geometric",
        "threshold": SIMILARITY_THRESHOLD,
    })


@app.route("/api/face/register", methods=["POST"])
def register_face():
    """
    Register a student's face.
    Body: { "studentId": "<mongo_id>", "image": "<base64>" }
    Supports optional multi-image registration: pass "images": ["<b64>", ...]
    """
    data       = request.json
    student_id = data.get("studentId")
    image_data = data.get("image")
    images_data = data.get("images", [])

    if not student_id:
        return jsonify({"error": "Missing studentId"}), 400
    if not image_data and not images_data:
        return jsonify({"error": "Missing image or images"}), 400

    try:
        obj_id = ObjectId(student_id)
    except Exception:
        return jsonify({"error": "Invalid student ID format"}), 400

    student = students_collection.find_one({"_id": obj_id})
    if not student:
        return jsonify({"error": f"Student ID '{student_id}' not found"}), 404

    all_images = images_data[:]
    if image_data:
        all_images.insert(0, image_data)

    embeddings_collected = []
    for idx, img_b64 in enumerate(all_images):
        try:
            bgr_img = decode_base64_image(img_b64)
        except Exception as e:
            return jsonify({"error": f"Image {idx+1} decode failed: {e}"}), 400

        emb, err = get_mediapipe_embedding(bgr_img)
        if err:
            return jsonify({"error": f"Image {idx+1}: {err}"}), 400
        embeddings_collected.append(emb)

    # Average + re-normalise
    avg_embedding = np.mean(embeddings_collected, axis=0)
    norm          = np.linalg.norm(avg_embedding)
    if norm > 0:
        avg_embedding = avg_embedding / norm

    students_collection.update_one(
        {"_id": obj_id},
        {"$set": {
            "faceRegistered": True,
            "faceEmbedding":  avg_embedding.tolist(),
            "embeddingModel": "mediapipe_face_landmarker_geometric",
        }}
    )

    return jsonify({
        "message":        "Face registered successfully!",
        "images_used":    len(embeddings_collected),
        "embedding_dims": len(avg_embedding),
    }), 200


@app.route("/api/face/recognize", methods=["POST"])
def recognize_face():
    """
    Recognize a face from a single image.
    Body: { "image": "<base64>" }
    """
    data       = request.json
    image_data = data.get("image")

    if not image_data:
        return jsonify({"error": "Missing image data"}), 400

    known_embeddings, known_metadata = load_registered_students()
    if not known_embeddings:
        return jsonify({"error": "No registered faces in database"}), 404

    try:
        bgr_img = decode_base64_image(image_data)
    except Exception as e:
        return jsonify({"error": f"Image decode failed: {e}"}), 400

    emb, err = get_mediapipe_embedding(bgr_img)
    if err:
        return jsonify({"match": False, "message": err}), 200

    best_idx, best_score = cosine_match(emb, known_embeddings, SIMILARITY_THRESHOLD)

    if best_idx >= 0:
        return jsonify({
            "match":      True,
            "student":    known_metadata[best_idx],
            "similarity": round(float(best_score), 4),
        }), 200

    return jsonify({
        "match":      False,
        "message":    "Face not recognised",
        "best_score": round(float(best_score), 4),
    }), 200


@app.route("/api/face/recognize/fused", methods=["POST"])
def recognize_face_fused():
    """
    Multi-Frame Fusion endpoint.
    Body: { "images": ["<b64>", "<b64>", ...] }
    """
    data        = request.json
    images_data = data.get("images", [])

    if not images_data or len(images_data) < 1:
        return jsonify({"error": "Provide at least 1 image in 'images' list"}), 400

    known_embeddings, known_metadata = load_registered_students()
    if not known_embeddings:
        return jsonify({"error": "No registered faces in database"}), 404

    collected_embs = []
    for idx, img_b64 in enumerate(images_data):
        try:
            bgr_img = decode_base64_image(img_b64)
            emb, err = get_mediapipe_embedding(bgr_img)
            if emb is not None:
                collected_embs.append(emb)
        except Exception:
            pass

    if not collected_embs:
        return jsonify({"match": False, "message": "No valid face detected in any frame"}), 200

    fused_emb = np.mean(collected_embs, axis=0)
    norm      = np.linalg.norm(fused_emb)
    if norm > 0:
        fused_emb = fused_emb / norm

    best_idx, best_score = cosine_match(fused_emb, known_embeddings, SIMILARITY_THRESHOLD)

    if best_idx >= 0:
        return jsonify({
            "match":        True,
            "student":      known_metadata[best_idx],
            "similarity":   round(float(best_score), 4),
            "frames_used":  len(collected_embs),
        }), 200

    return jsonify({
        "match":       False,
        "message":     "Face not recognised",
        "best_score":  round(float(best_score), 4),
        "frames_used": len(collected_embs),
    }), 200


@app.route("/api/face/mesh", methods=["POST"])
def get_face_mesh():
    """
    Return face mesh landmark data for visualization.
    Body: { "image": "<base64>" }
    """
    data       = request.json
    image_data = data.get("image")

    if not image_data:
        return jsonify({"error": "Missing image data"}), 400

    try:
        bgr_img = decode_base64_image(image_data)
    except Exception as e:
        return jsonify({"error": f"Image decode failed: {e}"}), 400

    rgb_image = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb_image.shape

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    result = face_landmarker.detect(mp_image)

    if not result.face_landmarks:
        return jsonify({"detected": False, "message": "No face detected"}), 200

    face = result.face_landmarks[0]
    landmarks = [[lm.x, lm.y, lm.z] for lm in face]

    return jsonify({
        "detected":      True,
        "landmarks":     landmarks,
        "num_landmarks": len(landmarks),
    }), 200


if __name__ == "__main__":
    print("[INFO] MediaPipe FaceLandmarker (Tasks API) loaded ✓")
    print(f"[INFO] Similarity threshold: {SIMILARITY_THRESHOLD}")
    app.run(host="0.0.0.0", port=5000, debug=True)
