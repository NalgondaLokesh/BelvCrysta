#!/usr/bin/env python3
"""
Test script to generate a valid JWT token for API testing
"""
import jwt
import datetime

# Generate a test token
SECRET_KEY = "crystal_secret"  # Must match the secret in crystal_routes.py
payload = {
    "id": "test_user_id",
    "username": "test_user",
    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
}

token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
print(f"Generated test token: {token}")
print(f"Use this token in your Authorization header: Bearer {token}")
