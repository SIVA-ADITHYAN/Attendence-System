import cv2
import face_recognition
import pymongo
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://mrsivakumar216_db_user:AoYjdNcYS4O3Porv@attendancesystem.d0l4ror.mongodb.net")
MONGO_DB = os.getenv("MONGODB_DATABASE", "attendance_db")

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB]
students_collection = db["students"]

def register_face(student_id):
    student = students_collection.find_one({"_id": student_id})
    if not student:
        print(f"Student with ID {student_id} not found in database.")
        return

    print(f"Registering face for: {student.get('studentName', student_id)}")
    print("Starting video source... Press 'c' to capture face, 'q' to quit.")
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        cv2.imshow('Register Face - Press c to capture', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('c'):
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_frame)
            
            if len(face_locations) == 0:
                print("No face detected. Please try again.")
                continue
            elif len(face_locations) > 1:
                print("Multiple faces detected. Please ensure only one face is in the frame.")
                continue
            
            face_encoding = face_recognition.face_encodings(rgb_frame, face_locations)[0]
            embedding_list = face_encoding.tolist()
            
            students_collection.update_one(
                {"_id": student_id},
                {"$set": {
                    "faceRegistered": True,
                    "faceEmbedding": embedding_list
                }}
            )
            print(f"Successfully registered face embedding for student!")
            break
        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    student_id = input("Enter Student ID to register face: ")
    register_face(student_id)
