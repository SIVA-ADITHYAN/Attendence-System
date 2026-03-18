from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
from deepface import DeepFace
import pymongo
import numpy as np
import os
import base64
from dotenv import load_dotenv
from bson.objectid import ObjectId

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://mrsivakumar216_db_user:AoYjdNcYS4O3Porv@attendancesystem.d0l4ror.mongodb.net")
MONGO_DB = os.getenv("MONGODB_DATABASE", "attendance_db")

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB]
students_collection = db["students"]

def load_registered_students():
    students = list(students_collection.find({"faceRegistered": True}))
    known_face_encodings = []
    known_face_metadata = []
    
    for student in students:
        if "faceEmbedding" in student:
            known_face_encodings.append(np.array(student["faceEmbedding"]))
            known_face_metadata.append({
                "id": str(student.get("_id")),
                "studentName": student.get("studentName"),
                "batchStartTime": student.get("batchStartTime"),
                "tutorId": student.get("tutorId")
            })
            
    return known_face_encodings, known_face_metadata

# Helper function to decode base64 string to RGB image
def decode_base64_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(',')[1]
    
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return rgb_img

@app.route('/api/face/register', methods=['POST'])
def register_face():
    data = request.json
    student_id = data.get('studentId')
    image_data = data.get('image')

    if not student_id or not image_data:
        return jsonify({"error": "Missing studentId or image"}), 400

    try:
        obj_id = ObjectId(student_id)
    except Exception:
        return jsonify({"error": "Invalid student ID format"}), 400

    student = students_collection.find_one({"_id": obj_id})
    if not student:
        return jsonify({"error": f"Student ID '{student_id}' not found in database"}), 404

    try:
        rgb_frame = decode_base64_image(image_data)
        
        # Determine embedding using deepface
        try:
            embedding_objs = DeepFace.represent(img_path=rgb_frame, model_name="Facenet", enforce_detection=True)
        except ValueError:
            return jsonify({"error": "No face detected in the image"}), 400

        if len(embedding_objs) == 0:
            return jsonify({"error": "No face detected in the image"}), 400
        elif len(embedding_objs) > 1:
            return jsonify({"error": "Multiple faces detected. Ensure only one face."}), 400
        
        embedding_list = embedding_objs[0]['embedding']
        
        students_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "faceRegistered": True,
                "faceEmbedding": embedding_list
            }}
        )
        return jsonify({"message": "Face registered successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/face/recognize', methods=['POST'])
def recognize_face():
    data = request.json
    image_data = data.get('image')

    if not image_data:
        return jsonify({"error": "Missing image data"}), 400

    known_face_encodings, known_face_metadata = load_registered_students()
    
    if not known_face_encodings:
        return jsonify({"error": "No registered faces in database"}), 404

    try:
        rgb_frame = decode_base64_image(image_data)
        
        try:
            target_embeddings = DeepFace.represent(img_path=rgb_frame, model_name="Facenet", enforce_detection=True)
            if len(target_embeddings) == 0:
                return jsonify({"match": False, "message": "No face detected"}), 200
        except ValueError:
            return jsonify({"match": False, "message": "No face detected"}), 200

        target_embedding = target_embeddings[0]['embedding']
        target_np = np.array(target_embedding)

        best_match_student = None
        min_distance = float('inf')
        threshold = 0.35 # Stricter threshold for Cosine distance on Facenet (standard is 0.40)

        # Match against known encodings using Cosine distance calculation
        for idx, known_encoding in enumerate(known_face_encodings):
            # Calculate Cosine similarity and convert to distance (1 - similarity)
            dot_product = np.dot(target_np, known_encoding)
            norm_target = np.linalg.norm(target_np)
            norm_known = np.linalg.norm(known_encoding)
            
            if norm_target == 0 or norm_known == 0:
                continue
                
            similarity = dot_product / (norm_target * norm_known)
            distance = 1.0 - similarity
            
            # Find the best match below the threshold
            if distance < min_distance and distance <= threshold:
                min_distance = distance
                best_match_student = known_face_metadata[idx]

        if best_match_student:
            return jsonify({"match": True, "student": best_match_student}), 200
        
        return jsonify({"match": False, "message": "Face not recognized"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
