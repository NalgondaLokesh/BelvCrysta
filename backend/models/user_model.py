from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://crystaladmin:crystalgen@cluster0.izeivgm.mongodb.net/?appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client["crystalgen_db"]
users = db["users"]

def create_user(username, email, password):
    if users.find_one({"email": email}):
        return {"error": "Email already exists"}
    hashed_pw = generate_password_hash(password)
    users.insert_one({"username": username, "email": email, "password": hashed_pw})
    return {"success": "User created"}

def authenticate_user(email, password):
    user = users.find_one({"email": email})
    if user and check_password_hash(user["password"], password):
        return {"success": True, "user": {"username": user["username"], "email": user["email"]}}
    return {"success": False, "error": "Invalid credentials"}
