from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
import math
import random
import numpy as np
import json
import jwt
import sys
from bson import json_util, ObjectId
from dotenv import load_dotenv

# Reconfigure stdout and stderr to UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Add parent directory of this file to sys.path to enable imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from cvae_generator import create_cvae_generator

# Load environment variables from .env file
load_dotenv()

# ==============================
# PHASE 1: CRITICAL SAFETY VALIDATION
# ==============================

# Atomic radii (in Angstroms) for minimum distance calculations
ATOMIC_RADII = {
    'H': 0.31, 'He': 0.28, 'Li': 1.28, 'Be': 0.96, 'B': 0.84, 'C': 0.76, 'N': 0.71, 'O': 0.66, 'F': 0.57, 'Ne': 0.58,
    'Na': 1.66, 'Mg': 1.41, 'Al': 1.21, 'Si': 1.11, 'P': 1.07, 'S': 1.05, 'Cl': 1.02, 'Ar': 1.06,
    'K': 2.03, 'Ca': 1.76, 'Sc': 1.70, 'Ti': 1.60, 'V': 1.53, 'Cr': 1.39, 'Mn': 1.39, 'Fe': 1.32, 'Co': 1.26, 'Ni': 1.24,
    'Cu': 1.32, 'Zn': 1.22, 'Ga': 1.22, 'Ge': 1.20, 'As': 1.19, 'Se': 1.16, 'Br': 1.14, 'Kr': 1.16,
    'Rb': 2.20, 'Sr': 1.95, 'Y': 1.80, 'Zr': 1.71, 'Nb': 1.64, 'Mo': 1.54, 'Tc': 1.47, 'Ru': 1.46, 'Rh': 1.42, 'Pd': 1.39,
    'Ag': 1.45, 'Cd': 1.44, 'In': 1.42, 'Sn': 1.39, 'Sb': 1.39, 'Te': 1.38, 'I': 1.39, 'Xe': 1.40
}

def get_minimum_distance(element1, element2):
    """Calculate minimum allowed distance between two atoms based on atomic radii"""
    radius1 = ATOMIC_RADII.get(element1, 1.0)  # Default to 1.0 Å for unknown elements
    radius2 = ATOMIC_RADII.get(element2, 1.0)
    # Minimum distance = sum of radii * 0.8 (allowing some compression)
    return (radius1 + radius2) * 0.8

def calculate_distance(pos1, pos2):
    """Calculate Euclidean distance between two positions"""
    return math.sqrt(sum((p1 - p2) ** 2 for p1, p2 in zip(pos1, pos2)))

def validate_interatomic_distances(atoms, tolerance=0.1):
    """
    Validate that no atoms are too close to each other
    
    Args:
        atoms: List of atom dictionaries with 'element' and 'position'
        tolerance: Additional tolerance factor for distance checks
    
    Returns:
        tuple: (is_valid, error_message, violations)
    """
    violations = []
    
    for i, atom1 in enumerate(atoms):
        for j, atom2 in enumerate(atoms[i+1:], i+1):
            element1 = atom1.get('element', 'Unknown')
            element2 = atom2.get('element', 'Unknown')
            pos1 = atom1.get('position', [0, 0, 0])
            pos2 = atom2.get('position', [0, 0, 0])
            
            # Validate position types
            if not all(isinstance(p, (int, float)) and not isinstance(p, bool) for p in pos1 + pos2):
                violations.append(f"Atoms {i}-{j}: Invalid position types")
                continue
            
            distance = calculate_distance(pos1, pos2)
            min_distance = get_minimum_distance(element1, element2)
            
            if distance < min_distance:
                violations.append(
                    f"Atoms {i}({element1})-{j}({element2}): "
                    f"Distance {distance:.3f}Å < minimum {min_distance:.3f}Å"
                )
    
    is_valid = len(violations) == 0
    error_message = f"Found {len(violations)} interatomic distance violations" if violations else None
    
    return is_valid, error_message, violations

def validate_coordinate_bounds(atoms):
    """
    Validate that atomic coordinates are within reasonable bounds
    
    Args:
        atoms: List of atom dictionaries with 'position' and 'frac_coords'
    
    Returns:
        tuple: (is_valid, error_message, violations)
    """
    violations = []
    
    for i, atom in enumerate(atoms):
        position = atom.get('position', [0, 0, 0])
        frac_coords = atom.get('frac_coords', [0, 0, 0])
        
        # Check Cartesian coordinates (should be positive and reasonable)
        for j, coord in enumerate(position):
            if not isinstance(coord, (int, float)) or isinstance(coord, bool):
                violations.append(f"Atom {i}: Invalid Cartesian coordinate type at index {j}")
            elif coord < 0:
                violations.append(f"Atom {i}: Negative Cartesian coordinate {coord:.3f} at index {j}")
            elif coord > 50.0:  # Maximum reasonable unit cell size
                violations.append(f"Atom {i}: Excessive Cartesian coordinate {coord:.3f} at index {j}")
        
        # Check fractional coordinates (should be between 0 and 1)
        for j, coord in enumerate(frac_coords):
            if not isinstance(coord, (int, float)) or isinstance(coord, bool):
                violations.append(f"Atom {i}: Invalid fractional coordinate type at index {j}")
            elif coord < -0.01:  # Small tolerance for numerical errors
                violations.append(f"Atom {i}: Fractional coordinate {coord:.3f} < 0 at index {j}")
            elif coord > 1.01:  # Small tolerance for numerical errors
                violations.append(f"Atom {i}: Fractional coordinate {coord:.3f} > 1 at index {j}")
    
    is_valid = len(violations) == 0
    error_message = f"Found {len(violations)} coordinate bound violations" if violations else None
    
    return is_valid, error_message, violations

def validate_lattice_parameters(lattice_params):
    """
    Validate that lattice parameters are physically reasonable
    
    Args:
        lattice_params: Dictionary with lattice parameters
    
    Returns:
        tuple: (is_valid, error_message, violations)
    """
    violations = []
    
    # Check required parameters
    required_params = ['a', 'b', 'c', 'alpha', 'beta', 'gamma', 'volume']
    for param in required_params:
        if param not in lattice_params:
            violations.append(f"Missing lattice parameter: {param}")
            continue
        
        value = lattice_params[param]
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            violations.append(f"Invalid type for lattice parameter {param}: {type(value)}")
            continue
    
    if violations:
        return False, f"Invalid lattice parameters", violations
    
    # Check lattice lengths
    for param in ['a', 'b', 'c']:
        value = lattice_params[param]
        if value <= 0:
            violations.append(f"Lattice parameter {param} must be positive: {value}")
        elif value < 1.0:
            violations.append(f"Lattice parameter {param} too small: {value:.3f}Å")
        elif value > 50.0:
            violations.append(f"Lattice parameter {param} too large: {value:.3f}Å")
    
    # Check lattice angles
    for param in ['alpha', 'beta', 'gamma']:
        value = lattice_params[param]
        if value <= 0 or value >= 180:
            violations.append(f"Lattice angle {param} must be between 0° and 180°: {value}")
    
    # Check volume consistency
    a, b, c = lattice_params['a'], lattice_params['b'], lattice_params['c']
    alpha, beta, gamma = lattice_params['alpha'], lattice_params['beta'], lattice_params['gamma']
    
    # Convert angles to radians
    alpha_rad = math.radians(alpha)
    beta_rad = math.radians(beta)
    gamma_rad = math.radians(gamma)
    
    # Calculate volume from lattice parameters
    volume_calc = a * b * c * math.sqrt(
        1 - math.cos(alpha_rad)**2 - math.cos(beta_rad)**2 - math.cos(gamma_rad)**2 +
        2 * math.cos(alpha_rad) * math.cos(beta_rad) * math.cos(gamma_rad)
    )
    
    volume_reported = lattice_params['volume']
    
    if abs(volume_calc - volume_reported) > 0.1 * volume_reported:  # 10% tolerance
        violations.append(
            f"Volume inconsistency: calculated {volume_calc:.3f} vs reported {volume_reported:.3f}"
        )
    
    is_valid = len(violations) == 0
    error_message = f"Found {len(violations)} lattice parameter violations" if violations else None
    
    return is_valid, error_message, violations

def comprehensive_structure_validation(formula, spacegroup, lattice_params, atoms):
    """
    Perform Phase 1 validation on generated crystal structure
    
    Args:
        formula: Chemical formula string
        spacegroup: Space group number
        lattice_params: Lattice parameters dictionary
        atoms: List of atom dictionaries
    
    Returns:
        tuple: (is_valid, validation_report)
    """
    validation_report = {
        'formula': formula,
        'spacegroup': spacegroup,
        'timestamp': datetime.utcnow().isoformat(),
        'validations': {},
        'overall_valid': True,
        'critical_errors': [],
        'warnings': []
    }
    
    overall_valid = True
    
    # Phase 1: Basic Safety Validation
    # 1. Validate lattice parameters
    lattice_valid, lattice_error, lattice_violations = validate_lattice_parameters(lattice_params)
    validation_report['validations']['lattice_parameters'] = {
        'valid': lattice_valid,
        'error': lattice_error,
        'violations': lattice_violations
    }
    if not lattice_valid:
        overall_valid = False
        validation_report['critical_errors'].extend(lattice_violations)
    
    # 2. Validate coordinate bounds
    coords_valid, coords_error, coords_violations = validate_coordinate_bounds(atoms)
    validation_report['validations']['coordinate_bounds'] = {
        'valid': coords_valid,
        'error': coords_error,
        'violations': coords_violations
    }
    if not coords_valid:
        overall_valid = False
        validation_report['critical_errors'].extend(coords_violations)
    
    # 3. Validate interatomic distances
    distance_valid, distance_error, distance_violations = validate_interatomic_distances(atoms)
    validation_report['validations']['interatomic_distances'] = {
        'valid': distance_valid,
        'error': distance_error,
        'violations': distance_violations
    }
    if not distance_valid:
        overall_valid = False
        validation_report['critical_errors'].extend(distance_violations)
    
    # Basic structure sanity checks
    if not atoms:
        validation_report['critical_errors'].append("No atoms in structure")
        overall_valid = False
    
    if len(atoms) > 100:  # Reasonable upper limit
        validation_report['warnings'].append(f"Large number of atoms: {len(atoms)}")
    
    # Check for all-zero positions
    zero_position_atoms = [i for i, atom in enumerate(atoms) 
                          if all(pos == 0 for pos in atom.get('position', [0, 0, 0]))]
    if zero_position_atoms:
        validation_report['warnings'].append(f"Atoms with zero positions: {zero_position_atoms}")
    
    validation_report['overall_valid'] = overall_valid
    
    return overall_valid, validation_report

# MongoDB connection configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://crystaladmin:crystalgen@cluster0.izeivgm.mongodb.net/?retryWrites=true&w=majority")
DB_NAME = "crystalgen_db"
COLLECTION_NAME = "structures"

client = None
db = None
models = None

try:
    print("🔌 Connecting to Crystal MongoDB...")
    client = MongoClient(MONGO_URI, 
                        retryWrites=True, 
                        connectTimeoutMS=5000,
                        serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    db = client[DB_NAME]
    models = db[COLLECTION_NAME]
    
    # Ensure indexes exist
    models.create_index([("username", 1)])
    models.create_index([("timestamp", -1)])
    print("✅ Successfully connected to MongoDB and initialized indexes")
    
except Exception as e:
    print("❌ Error connecting to MongoDB:", str(e))
    print("⚠️ Running in offline/mock mode - database saves will be skipped")
    db = None
    models = None

# Initialize the CVAE generator
generator = create_cvae_generator()

crystal_bp = Blueprint('crystal', __name__)
SECRET_KEY = "crystal_secret"



def generate_crystal_structure(formula, spacegroup, composition, num_atoms, temperature):
    """
    Generate crystal structure using trained CVAE model if available,
    otherwise fallback to the grid-based fallback generator.
    """
    print(f"\n🔬 Generating structure for {formula} with {num_atoms} atoms at T={temperature}")
    
    if 'generator' in globals() and generator and generator.model_loaded:
        try:
            print("🤖 Using trained CVAE model for generation...")
            structure = generator.generate_structure_cvae(
                spacegroup_idx=spacegroup,
                comp_dict=composition,
                num_atoms=num_atoms,
                temperature=temperature
            )
            
            # Extract lattice parameters
            lattice_params = {
                "a": float(structure.lattice.a),
                "b": float(structure.lattice.b),
                "c": float(structure.lattice.c),
                "alpha": float(structure.lattice.alpha),
                "beta": float(structure.lattice.beta),
                "gamma": float(structure.lattice.gamma),
                "volume": float(structure.lattice.volume)
            }
            
            # Extract atoms
            atoms = []
            for s in structure:
                atoms.append({
                    "element": s.specie.symbol,
                    "position": [float(x) for x in s.coords],
                    "frac_coords": [float(x) for x in s.frac_coords]
                })
                
            # Generate XYZ data
            xyz_lines = [f"{len(atoms)}\n{formula}"]
            for atom in atoms:
                pos = atom["position"]
                xyz_lines.append(f"{atom['element']} {pos[0]:.6f} {pos[1]:.6f} {pos[2]:.6f}")
            xyz_data = "\n".join(xyz_lines)
            
            # Generate CIF data
            cif_data = structure.to(fmt="cif")
            
            result = {
                "formula": formula,
                "spacegroup": int(spacegroup),
                "lattice_parameters": lattice_params,
                "atoms": atoms,
                "xyz_data": xyz_data,
                "cif_data": cif_data
            }
            
            print(f"✅ Generated {len(atoms)} atoms using CVAE model")
            return result
            
        except Exception as e:
            print(f"⚠️ CVAE generation failed: {e}. Falling back to procedural generator...")
            import traceback
            traceback.print_exc()
            
    # Fallback procedural generation
    print("🔄 Using enhanced fallback generator...")
    structure_dict = generate_structure_fallback(spacegroup, composition, num_atoms, temperature)
    lattice_params = structure_dict['lattice_parameters']
    atoms = structure_dict['atoms']
    
    # Verify atoms have valid positions
    for i, atom in enumerate(atoms):
        pos = atom["position"]
        if not all(isinstance(p, (int, float)) and not (isinstance(p, bool)) for p in pos):
            print(f"WARNING: Atom {i} has invalid position types: {[type(p) for p in pos]}")
        if all(p == 0 for p in pos):
            print(f"WARNING: Atom {i} has all zero positions!")
    
    # Generate XYZ data
    xyz_lines = [f"{len(atoms)}\n{formula}"]
    for atom in atoms:
        pos = atom["position"]
        xyz_lines.append(f"{atom['element']} {pos[0]:.6f} {pos[1]:.6f} {pos[2]:.6f}")
    xyz_data = "\n".join(xyz_lines)
    
    # Generate CIF data
    cif_data = f"""data_{formula}
_cell_length_a {lattice_params['a']:.6f}
_cell_length_b {lattice_params['b']:.6f}
_cell_length_c {lattice_params['c']:.6f}
_cell_angle_alpha {lattice_params['alpha']:.2f}
_cell_angle_beta {lattice_params['beta']:.2f}
_cell_angle_gamma {lattice_params['gamma']:.2f}
_symmetry_space_group_name_H-M "{spacegroup}"
loop_
_atom_site_label
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
"""
    
    for i, atom in enumerate(atoms):
        frac = atom["frac_coords"]
        cif_data += f"{atom['element']}{i+1} {frac[0]:.6f} {frac[1]:.6f} {frac[2]:.6f}\n"

    result = {
        "formula": formula,
        "spacegroup": int(spacegroup),
        "lattice_parameters": lattice_params,
        "atoms": atoms,
        "xyz_data": xyz_data,
        "cif_data": cif_data
    }
    
    print(f"\n✅ Generated {len(atoms)} atoms with valid positions")
    return result

def generate_structure_fallback(spacegroup, composition, num_atoms, temperature):
    """
    Enhanced fallback generator for when CVAE model is not available
    """
    # Calculate lattice parameters based on composition and space group
    base_length = max(5.0 + (num_atoms * 0.2), 8.0)
    
    # Adjust for space group
    if spacegroup >= 195:  # Cubic
        lattice_params = [base_length, base_length, base_length, 90.0, 90.0, 90.0]
    elif spacegroup >= 75:  # Tetragonal
        lattice_params = [base_length, base_length, base_length * 1.1, 90.0, 90.0, 90.0]
    else:  # Other systems
        lattice_params = [base_length, base_length * 1.05, base_length * 1.1, 90.0, 90.0, 90.0]
    
    # Generate atomic positions
    elements = list(composition.keys())
    atoms = []
    
    # Create a simple grid-based structure
    import numpy as np
    grid_size = int(np.ceil(num_atoms ** (1/3))) + 1
    spacing = 0.8 / grid_size
    
    atom_count = 0
    for element, amount in composition.items():
        for i in range(int(amount)):
            if atom_count >= num_atoms:
                break
            
            # Grid position with some randomness
            grid_x = (atom_count % grid_size) / grid_size
            grid_y = ((atom_count // grid_size) % grid_size) / grid_size
            grid_z = (atom_count // (grid_size * grid_size)) / grid_size
            
            # Add temperature-controlled randomness
            noise = temperature * 0.05
            frac_x = min(max(grid_x + random.uniform(-noise, noise), 0.05), 0.95)
            frac_y = min(max(grid_y + random.uniform(-noise, noise), 0.05), 0.95)
            frac_z = min(max(grid_z + random.uniform(-noise, noise), 0.05), 0.95)
            
            # Convert to Cartesian coordinates
            cart_x = frac_x * lattice_params[0]
            cart_y = frac_y * lattice_params[1]
            cart_z = frac_z * lattice_params[2]
            
            atoms.append({
                'element': element,
                'position': [cart_x, cart_y, cart_z],
                'frac_coords': [frac_x, frac_y, frac_z]
            })
            
            atom_count += 1
    
    # Create structure dictionary
    structure_dict = {
        'lattice_parameters': {
            'a': lattice_params[0],
            'b': lattice_params[1],
            'c': lattice_params[2],
            'alpha': lattice_params[3],
            'beta': lattice_params[4],
            'gamma': lattice_params[5],
            'volume': lattice_params[0] * lattice_params[1] * lattice_params[2]
        },
        'atoms': atoms
    }
    
    return structure_dict
def verify_document(doc_id):
    """Verify a document exists in MongoDB and has required fields"""
    if models is None:
        print("⚠️ Offline Mode: verify_document skipped")
        return {"_id": doc_id, "offline": True}
        
    doc = models.find_one({"_id": doc_id})
    if not doc:
        raise Exception("Document not found after save")
    
    required_fields = ['username', 'formula', 'spacegroup', 'composition', 'timestamp']
    missing = [field for field in required_fields if field not in doc]
    if missing:
        models.delete_one({"_id": doc_id})  # Rollback invalid document
        raise Exception(f"Saved document missing required fields: {missing}")
    
    return doc

def save_to_mongodb(username, document):
    """Save document to MongoDB with proper error handling"""
    if models is None:
        print("⚠️ Offline Mode: save_to_mongodb mock return")
        import bson
        return bson.ObjectId()
        
    try:
        # Add timestamp if not present
        if 'timestamp' not in document:
            document['timestamp'] = datetime.utcnow()
        
        # Insert document
        result = models.insert_one(document)
        print(f"✅ Document saved to MongoDB with ID: {result.inserted_id}")
        return result.inserted_id
        
    except Exception as e:
        print(f"❌ Error saving to MongoDB: {str(e)}")
        raise Exception(f"Failed to save to database: {str(e)}")





@crystal_bp.route('/elements', methods=['GET'])
def get_elements():
    elements = [
        'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
        'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
        'Ti', 'Fe'
    ]
    return jsonify({"success": True, "elements": elements})

@crystal_bp.route('/generate', methods=['POST'])
def generate_model():
    print("\n=== Generate Request Started ===")
    try:
        # 1. Validate Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ Invalid or missing Authorization header")
            return jsonify({"error": "Invalid or missing Authorization header"}), 401
        
        try:
            # Extract and decode token
            token = auth_header.split(' ')[1]
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            username = decoded.get("username")
            user_id = str(decoded.get("id"))

            if not username or not user_id:
                print("❌ Missing user information in token")
                print("Token payload:", decoded)
                return jsonify({"error": "Invalid token: missing user information"}), 401

            print(f"✅ Authenticated user: {username} (ID: {user_id})")
            
        except Exception as e:
            print("JWT decode error:", e)
            return jsonify({"error": "Invalid token"}), 401

        # 2. Validate request data
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.json
        print("Received request data:", json.dumps(data, indent=2))

        # 3. Extract and validate parameters
        composition = data.get('composition', {})
        if not composition:
            return jsonify({"error": "Composition is required"}), 400

        spacegroup = int(data.get('spacegroup', 225))
        num_atoms = int(data.get('num_atoms', 8))
        temperature = float(data.get('temperature', 1.0))

        # 4. Generate crystal structure
        formula = "".join([f"{el}{amt}" for el, amt in composition.items()])
        print(f"\nGenerating structure for formula: {formula}")
        print(f"Parameters: spacegroup={spacegroup}, num_atoms={num_atoms}, temperature={temperature}")
        print(f"Composition: {composition}")

        try:
            result = generate_crystal_structure(
                formula=formula,
                spacegroup=spacegroup,
                composition=composition,
                num_atoms=num_atoms,
                temperature=temperature
            )
            
            # Verify the generated structure
            if not result.get('atoms'):
                raise ValueError("No atoms generated in structure")
            
            print(f"✅ Successfully generated structure with {len(result['atoms'])} atoms")
            
            # ========================================
            # PHASE 1: COMPREHENSIVE STRUCTURE VALIDATION
            # ========================================
            print("\n🔍 Performing Phase 1 validation...")
            
            is_valid, validation_report = comprehensive_structure_validation(
                formula=formula,
                spacegroup=spacegroup,
                lattice_params=result['lattice_parameters'],
                atoms=result['atoms']
            )
            
            print(f"📊 Validation Results:")
            print(f"   Overall Valid: {is_valid}")
            print(f"   Lattice Parameters: {validation_report['validations']['lattice_parameters']['valid']}")
            print(f"   Coordinate Bounds: {validation_report['validations']['coordinate_bounds']['valid']}")
            print(f"   Interatomic Distances: {validation_report['validations']['interatomic_distances']['valid']}")
            
            if validation_report['critical_errors']:
                print(f"❌ Critical Errors ({len(validation_report['critical_errors'])}):")
                for error in validation_report['critical_errors']:
                    print(f"   - {error}")
            
            if validation_report['warnings']:
                print(f"⚠️  Warnings ({len(validation_report['warnings'])}):")
                for warning in validation_report['warnings']:
                    print(f"   - {warning}")
            
            # If validation fails, return detailed error
            if not is_valid:
                error_msg = f"Structure validation failed with {len(validation_report['critical_errors'])} critical errors"
                print(f"❌ {error_msg}")
                return jsonify({
                    "success": False,
                    "error": error_msg,
                    "validation_report": validation_report
                }), 400
            
            print("✅ Phase 1 validation passed!")
            
            # Add validation report to result for frontend display
            result['validation_report'] = validation_report
            
        except Exception as e:
            print(f"❌ Error generating structure: {str(e)}")
            return jsonify({"error": f"Failed to generate structure: {str(e)}"}), 500

        # 5. Save to database (flattened fields + result wrapper + multiple date fields for complete compatibility)
        now = datetime.utcnow()
        document = {
            "user_id": user_id,
            "username": username,
            "formula": formula,
            "spacegroup": spacegroup,
            "composition": composition,
            "num_atoms": num_atoms,
            "temperature": temperature,
            "lattice_parameters": result["lattice_parameters"],
            "atoms": result["atoms"],
            "xyz_data": result["xyz_data"],
            "cif_data": result["cif_data"],
            "validation_report": result.get("validation_report"),
            "result": result,
            "timestamp": now,
            "created_at": now,
            "generated_at": now
        }

        try:
            inserted_id = save_to_mongodb(username, document)
            saved_doc = verify_document(inserted_id)
            print(f"✅ Saved structure to database with ID: {inserted_id}")
        except Exception as e:
            print(f"❌ Database error: {str(e)}")
            return jsonify({"error": f"Failed to save structure: {str(e)}"}), 500

        # 6. Return successful response
        response_data = {
            "success": True,
            "message": "Structure generated successfully",
            "model_id": str(inserted_id),
            **result
        }
        
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@crystal_bp.route('/history/<username>', methods=['GET'])
def get_history(username):
    print(f"\n=== FETCHING HISTORY FOR {username} ===")
    try:
        # 1. Validate Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ Invalid or missing Authorization header")
            return jsonify({"error": "Invalid or missing Authorization header"}), 401
        
        try:
            # Extract and decode token
            token = auth_header.split(' ')[1]
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            token_username = decoded.get("username")
            user_id = decoded.get("id")

            # Verify token matches requested username
            if not token_username or not user_id or token_username != username:
                print("❌ Token username doesn't match requested username")
                return jsonify({"error": "Unauthorized access"}), 403

            print(f"✅ Authenticated user: {username} (ID: {user_id})")
            
        except Exception as e:
            print("JWT decode error:", e)
            return jsonify({"error": "Invalid token"}), 401

        # 2. Check MongoDB connection
        try:
            db.command("ping")
            print("MongoDB connection verified")
        except Exception as conn_err:
            print("MongoDB connection error:", str(conn_err))
            return jsonify({"error": "Database connection error"}), 500

        # 3. Check collection exists and count all documents
        total_docs = models.count_documents({})
        print(f"Total documents in collection: {total_docs}")

        # 4. Search for user's documents using user_id
        user_docs = models.count_documents({"user_id": user_id})
        print(f"Documents for user {username} (ID: {user_id}): {user_docs}")

        # 5. Fetch user's models using user_id
        user_models = list(models.find(
            {"user_id": user_id},
            {"_id": 1, "formula": 1, "result": 1, "timestamp": 1}
        ))
        
        # 5. Convert for JSON response
        formatted_models = []
        for model in user_models:
            model['_id'] = str(model['_id'])
            formatted_models.append(model)

        print(f"Successfully retrieved {len(formatted_models)} models")
        
        return jsonify({
            "success": True,
            "history": formatted_models,
            "total_count": total_docs,
            "user_count": user_docs
        })

    except Exception as e:
        print("Error in get_history:", str(e))
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500
