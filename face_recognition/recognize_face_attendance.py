import cv2
import face_recognition
import pymongo
import numpy as np
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://mrsivakumar216_db_user:AoYjdNcYS4O3Porv@attendancesystem.d0l4ror.mongodb.net")
MONGO_DB = os.getenv("MONGODB_DATABASE", "attendance_db")

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB]
students_collection = db["students"]

API_BASE_URL = "http://localhost:8080/api"
marked_today = set()

def get_registered_students():
    students = list(students_collection.find({"faceRegistered": True}))
    known_face_encodings = []
    known_face_metadata = []
    
    for student in students:
        if "faceEmbedding" in student:
            known_face_encodings.append(np.array(student["faceEmbedding"]))
            known_face_metadata.append(student)
            
    return known_face_encodings, known_face_metadata

def process_attendance_for_student(student):
    student_id = str(student.get("_id"))
    if student_id in marked_today:
        return
        
    date_str = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now()
    time_str = current_time.strftime("%H:%M:%S")

    status = "PRESENT"
    batch_start_time_str = student.get("batchStartTime")
    
    if batch_start_time_str:
        try:
            if isinstance(batch_start_time_str, str):
                batch_time = datetime.strptime(batch_start_time_str, "%H:%M:%S").time()
            elif isinstance(batch_start_time_str, dict):
                 hour = batch_start_time_str.get('hour', 0)
                 minute = batch_start_time_str.get('minute', 0)
                 second = batch_start_time_str.get('second', 0)
                 batch_time = datetime.now().replace(hour=hour, minute=minute, second=second).time()
            else:
                batch_time = None
                
            if batch_time and current_time.time() > batch_time:
                status = "LATE"
        except Exception as e:
            pass

    payload = {
        "studentId": student_id,
        "tutorId": student.get("tutorId"),
        "date": date_str,
        "status": status,
        "checkInTime": time_str,
        "remarks": "Automated Face Recognition Attendance"
    }

    try:
        response = requests.post(f"{API_BASE_URL}/attendance", json=payload)
        if response.status_code == 201:
            print(f"Attendance marked successfully for {student.get('studentName')} - Status: {status}")
            marked_today.add(student_id)
        else:
            print(f"Failed to mark attendance for {student.get('studentName')}: {response.text}")
    except Exception as e:
        print(f"API Error marking attendance for {student.get('studentName')}: {e}")

def mark_attendance():
    print("Loading students from database...")
    known_face_encodings, known_face_metadata = get_registered_students()
    
    if len(known_face_encodings) == 0:
        print("No registered faces found in database.")
        return

    print("Starting video source... Press 'q' to quit.")
    cap = cv2.VideoCapture(0)
    
    process_this_frame = True
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if process_this_frame:
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            
            face_names = []
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.5)
                name = "Unknown"
                
                face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        student = known_face_metadata[best_match_index]
                        name = student.get("studentName", "Unknown")
                        process_attendance_for_student(student)
                
                face_names.append(name)
                
        process_this_frame = not process_this_frame
        
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4
            
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(frame, name, (left + 6, bottom - 6), font, 0.7, (255, 255, 255), 1)

        cv2.imshow('Face Recognition Attendance', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    mark_attendance()
