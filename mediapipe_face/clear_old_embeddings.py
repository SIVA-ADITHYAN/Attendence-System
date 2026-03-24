"""
Migration Script: Clear old InsightFace/DeepFace embeddings.

Since we switched from InsightFace (512-D ArcFace) to MediaPipe Face Mesh
(geometric embedding), all existing face embeddings are incompatible.
This script resets faceRegistered to False and removes the old embeddings
so students can re-register with the new MediaPipe system.
"""

import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://mrsivakumar216_db_user:AoYjdNcYS4O3Porv@attendancesystem.d0l4ror.mongodb.net")
MONGO_DB = os.getenv("MONGODB_DATABASE", "attendance_db")

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB]
students_collection = db["students"]

def clear_old_faces():
    print("=" * 60)
    print("  Migration: InsightFace → MediaPipe Face Mesh")
    print("=" * 60)
    print()
    print("Clearing old InsightFace face embeddings...")
    print("This will reset ALL students' face registration status.")
    print()

    # Count how many students have registered faces
    count = students_collection.count_documents({"faceRegistered": True})
    print(f"Found {count} student(s) with registered faces.")

    if count == 0:
        print("No students to reset. You're good to go!")
        return

    print(f"Automatically resetting face data for {count} students...")

    result = students_collection.update_many(
        {"faceRegistered": True},
        {
            "$set": {"faceRegistered": False},
            "$unset": {"faceEmbedding": "", "embeddingModel": ""},
        }
    )
    print(f"\n✓ Migration complete! {result.modified_count} students reset.")
    print("  They will need to re-register their faces via the frontend.")
    print("  The new system uses MediaPipe Face Mesh for face structure identification.")

if __name__ == "__main__":
    clear_old_faces()
