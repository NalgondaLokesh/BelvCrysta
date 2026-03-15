from pymongo import MongoClient
import os
from datetime import datetime

# ✅ Connect to MongoDB Atlas
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://crystaladmin:crystalgen@cluster0.izeivgm.mongodb.net/?appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client["crystalgen_db"]
crystals = db["crystals"]

def save_crystal(username, formula, output_data):
    """Insert generated crystal into MongoDB"""
    record = {
        "username": username,
        "formula": formula,
        "output_data": output_data,
        "timestamp": datetime.now()
    }
    crystals.insert_one(record)
    return {"success": True, "message": "Crystal saved successfully"}

def get_user_history(username):
    """Fetch user's past generated models"""
    results = list(crystals.find({"username": username}, {"_id": 0}))
    return results
