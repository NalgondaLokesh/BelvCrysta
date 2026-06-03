import sys
# Reconfigure standard output streams to UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from pymongo import MongoClient
import traceback
import jwt
import datetime
import os
from routes.auth_routes import auth_bp
from routes.crystal_routes import crystal_bp
from bson import ObjectId
from dotenv import load_dotenv
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Load environment variables from .env file
load_dotenv()

# ==============================
# CONFIGURATION
# ==============================
SECRET_KEY = os.getenv("SECRET_KEY", "crystal_secret")
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://crystaladmin:crystalgen@cluster0.izeivgm.mongodb.net/?appName=Cluster0")

# ==============================
# CONNECT TO MONGODB
# ==============================
db = None
structures_col = None
try:
    print("🔌 Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    db = client["crystalgen_db"]   # ✅ ensure correct DB
    structures_col = db["structures"]
    print("✅ Connected successfully to DB: crystalgen_db, Collection: structures")
except Exception as e:
    print("❌ MongoDB connection failed:", e)
    print("⚠️ Running in offline mode - database features will be disabled")
    db = None
    structures_col = None

# ==============================
# MODEL CONSTANTS
# ==============================
ELEMENTS = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Ti','Fe']
EL_TO_IDX = {e: i for i, e in enumerate(ELEMENTS)}
N_ELEM = len(ELEMENTS)
MAX_ATOMS = 64
LATENT_DIM = 128

# ==============================
# MODEL DEFINITIONS
# ==============================
class SpaceGroupEmbedding(nn.Module):
    def __init__(self, max_sg=230, emb_dim=64):
        super().__init__()
        self.embed = nn.Embedding(max_sg + 1, emb_dim)
    def forward(self, x):
        return self.embed(x)

class Encoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.sg_emb = SpaceGroupEmbedding()
        in_dim = 9 + MAX_ATOMS * 3 + MAX_ATOMS * N_ELEM
        self.fc1 = nn.Linear(in_dim + 64, 512)
        self.fc_mu = nn.Linear(512, LATENT_DIM)
        self.fc_logvar = nn.Linear(512, LATENT_DIM)
    def forward(self, lattice, frac, species_oh, sg_idx):
        x = torch.cat([
            lattice.view(lattice.size(0), -1),
            frac.view(frac.size(0), -1),
            species_oh.view(species_oh.size(0), -1)
        ], dim=-1)
        sg_e = self.sg_emb(sg_idx)
        x = torch.cat([x, sg_e], dim=-1)
        h = F.relu(self.fc1(x))
        return self.fc_mu(h), self.fc_logvar(h)

class Decoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.sg_emb = SpaceGroupEmbedding()
        out_dim = 9 + MAX_ATOMS * 3 + MAX_ATOMS * N_ELEM
        self.fc1 = nn.Linear(LATENT_DIM + 64, 512)
        self.fc_out = nn.Linear(512, out_dim)
    def forward(self, z, sg_idx):
        sg_e = self.sg_emb(sg_idx)
        x = torch.cat([z, sg_e], dim=-1)
        h = F.relu(self.fc1(x))
        out = self.fc_out(h)
        lattice = out[:, :9].view(-1, 3, 3)
        frac = out[:, 9:9 + MAX_ATOMS * 3].view(-1, MAX_ATOMS, 3)
        species_logits = out[:, 9 + MAX_ATOMS * 3:].view(-1, MAX_ATOMS, N_ELEM)
        return lattice, frac, species_logits

class CVAE(nn.Module):
    def __init__(self):
        super().__init__()
        self.enc = Encoder()
        self.dec = Decoder()
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std
    def forward(self, lattice, frac, species_oh, sg_idx):
        mu, logvar = self.enc(lattice, frac, species_oh, sg_idx)
        z = self.reparameterize(mu, logvar)
        lattice_rec, frac_rec, species_logits = self.dec(z, sg_idx)
        return lattice_rec, frac_rec, species_logits, mu, logvar

# ==============================
# FLASK SETUP
# ==============================
app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp)
app.register_blueprint(crystal_bp, url_prefix='/api')



# ==============================
# UTILITIES
# ==============================
def decode_jwt(token):
    if not token:
        print("❌ No JWT token provided")
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print("✅ JWT decoded successfully:", payload)
        return payload
    except jwt.ExpiredSignatureError:
        print("❌ Token expired.")
        return None
    except jwt.InvalidTokenError as e:
        print("❌ Invalid JWT token:", e)
        return None



# ==============================
# ROUTES
# ==============================
# NOTE: /api/generate is handled by crystal_routes.py blueprint
# This allows us to use the dummy generator with Phase 1 validation

# Set up collection only if database is connected
if db is not None:
    collection = db["structures"]
else:
    collection = None

@app.route('/api/history', methods=['GET'])
def get_history():
    print("\n=== /api/history called ===")

    token = request.args.get("token")
    print("🔑 Token received:", token)

    user_id = None
    if token:
        try:
            decoded = jwt.decode(token, "crystal_secret", algorithms=["HS256"])
            user_id = decoded.get("id")
            print(f"✅ Token decoded successfully. User ID: {user_id}")
        except jwt.ExpiredSignatureError:
            print("❌ Token has expired")
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid JWT token: {e}")
            return jsonify({"error": "Invalid token"}), 401
    else:
        print("⚠️ No token provided")
        return jsonify({"error": "No token provided"}), 400

    if collection is None:
        print("⚠️ Offline Mode: Returning mock empty history")
        return jsonify({"history": []})

    print("📚 Fetching structures from MongoDB for user:", user_id)
    user_structures = list(collection.find({"user_id": user_id}).sort("generated_at", -1))

    for s in user_structures:
        s["_id"] = str(s["_id"])

    print(f"✅ Found {len(user_structures)} records.")
    return jsonify({"history": user_structures})



# ✅ Get specific structure by ID (for visualization)
@app.route("/api/structure/<string:structure_id>", methods=["GET"])
def get_structure(structure_id):
    token = request.args.get("token")
    if not token:
        return jsonify({"success": False, "error": "Missing token"}), 400

    try:
        decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        user_id = decoded["id"]
    except Exception as e:
        print("❌ JWT decode failed:", e)
        return jsonify({"success": False, "error": "Invalid token"}), 401

    if collection is None:
        return jsonify({"success": False, "error": "Offline mode: database offline"}), 503

    try:
        structure = collection.find_one({"_id": ObjectId(structure_id), "user_id": user_id})
    except Exception as e:
        return jsonify({"success": False, "error": "Invalid structure ID"}), 400

    if not structure:
        return jsonify({"success": False, "error": "Structure not found"}), 404

    structure["_id"] = str(structure["_id"])

    return jsonify({
        "success": True,
        "structure": {
            "_id": structure["_id"],
            "formula": structure.get("formula"),
            "spacegroup": structure.get("spacegroup"),
            "lattice_parameters": structure.get("lattice_parameters"),
            "atoms": structure.get("atoms"),
            "xyz_data": structure.get("xyz_data"),
            "cif_data": structure.get("cif_data"),
            "created_at": structure.get("created_at")
        }
    }), 200


# NOTE: /api/elements is handled by crystal_routes.py blueprint

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "BelvCrysta API Running",
        "endpoints": {
            "generate": "/api/generate",
            "elements": "/api/elements"
        }
    })

# ==============================
# RUN SERVER
# ==============================
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    print(f"\n🚀 Starting Flask server at http://0.0.0.0:{port}")
    print(f"🔧 Debug mode: {debug_mode}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
