from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

auth_bp = Blueprint("auth_bp", __name__)

SECRET_KEY = os.getenv("SECRET_KEY", "crystal_secret")

# ✅ Use your MongoDB Atlas connection string here
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://crystaladmin:crystalgen@cluster0.izeivgm.mongodb.net/?appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client["crystalgen_db"]
users = db["users"]

@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    hashed_pw = generate_password_hash(password)
    users.insert_one({
        "username": username,
        "email": email,
        "password": hashed_pw,
        "created_at": datetime.utcnow()
    })

    return jsonify({"message": "User created successfully!"}), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        user = users.find_one({"email": email})
        if not user:
            return jsonify({"error": "Invalid email"}), 401

        if not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid password"}), 401

        token = jwt.encode(
            {"id": str(user["_id"]), "username": user["username"], "exp": datetime.utcnow() + timedelta(hours=24)},
            SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "success": True,
            "token": token,
            "username": user["username"]
        }), 200
    except Exception as e:
        print("Login Error:", e)
        return jsonify({"error": str(e)}), 500
