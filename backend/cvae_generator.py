#!/usr/bin/env python3
"""
CVAE Model Integration for Crystal Structure Generation
Replaces the dummy generator with the trained CVAE model
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from pymatgen.core import Structure, Lattice
import math
import random
from datetime import datetime

# Import the CVAE model from train_cvae.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class CVAEGenerator:
    """Advanced crystal structure generator using trained CVAE model"""
    
    def __init__(self, model_path=None):
        self.model = None
        self.model_loaded = False
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Model constants (matching train_cvae.py)
        self.LATENT_DIM = 128  # From train_cvae.py
        self.N_ELEM = 22  # Number of elements in training
        self.MAX_ATOMS = 64  # From train_cvae.py
        self.ELEMENTS = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Ti','Fe']
        self.EL_TO_IDX = {e: i for i, e in enumerate(self.ELEMENTS)}
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def load_model(self, model_path):
        """Load the trained CVAE model"""
        try:
            # Import CVAE model class (assuming it's defined in train_cvae.py)
            from train_cvae import CVAE
            self.model = CVAE()  # No arguments - matches train_cvae.py definition
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            self.model_loaded = True
            print(f"✅ CVAE model loaded from {model_path}")
            return True
        except Exception as e:
            print(f"❌ Failed to load CVAE model: {e}")
            self.model_loaded = False
            return False
    
    def generate_structure_cvae(self, spacegroup_idx, comp_dict, num_atoms=8, temperature=1.0):
        """
        Generate crystal structure using the trained CVAE model
        
        Args:
            spacegroup_idx: Space group number (1-230)
            comp_dict: Composition dictionary (e.g., {'Na': 1, 'Cl': 1})
            num_atoms: Number of atoms to generate
            temperature: Sampling temperature (higher = more random)
        
        Returns:
            pymatgen Structure object
        """
        if not self.model_loaded:
            raise Exception("CVAE model not loaded. Please train and load the model first.")
        
        # Convert composition to model format
        elements = list(comp_dict.keys())
        element_indices = [self.EL_TO_IDX.get(el, 0) for el in elements]
        
        # Generate latent vector
        z = torch.randn((1, 128), device=self.device) * temperature  # LATENT_DIM = 128 from train_cvae.py
        
        # Convert spacegroup to tensor
        sg_idx = torch.tensor([spacegroup_idx], dtype=torch.long, device=self.device)
        
        # Generate structure using the actual decode method
        with torch.no_grad():
            lat_pred, frac_pred, species_logits = self.model.dec(z, sg_idx)
        
        # Convert predictions to structure
        return self._predictions_to_structure(lat_pred, frac_pred, species_logits, elements, num_atoms)
    
    def _predictions_to_structure(self, lat_pred, frac_pred, species_logits, elements, num_atoms):
        """Convert model predictions to pymatgen Structure"""
        # Move to CPU and convert to numpy
        lat = lat_pred.detach().cpu().numpy()[0]  # Shape: (3, 3) - lattice matrix
        frac = frac_pred.detach().cpu().numpy()[0]  # Shape: (MAX_ATOMS, 3)
        species_logits = species_logits.detach().cpu().numpy()[0]  # Shape: (MAX_ATOMS, N_ELEM)
        
        # Extract lattice parameters from lattice matrix
        # For simplicity, use the diagonal as lattice parameters
        a, b, c = np.abs(np.diag(lat))
        
        # Ensure positive lattice parameters
        a, b, c = max(a, 1.0), max(b, 1.0), max(c, 1.0)
        a, b, c = min(a, 50.0), min(b, 50.0), min(c, 50.0)  # Reasonable bounds
        
        # Create lattice (assuming cubic for simplicity)
        lattice = Lattice.from_parameters(a, b, c, 90, 90, 90)
        
        # Generate species assignments for the requested number of atoms
        species_indices = np.argmax(species_logits[:num_atoms], axis=1)
        species_symbols = [elements[i % len(elements)] for i in species_indices]
        
        # Use the fractional coordinates for the requested number of atoms
        frac_coords = frac_pred[:num_atoms]
        
        # Ensure fractional coordinates are in [0, 1]
        frac_coords = frac_coords % 1.0
        
        # Create sites
        sites = []
        for i in range(num_atoms):
            sites.append({
                'species': [{"element": species_symbols[i], "occu": 1}],
                'abc': frac_coords[i].tolist()
            })
        
        # Create structure
        structure = Structure.from_dict({
            'lattice': lattice.as_dict(),
            'sites': sites,
            'charge': 0
        })
        
        return structure
    
    def generate_with_energy_minimization(self, spacegroup_idx, comp_dict, num_atoms=8, temperature=1.0):
        """
        Generate structure with simple energy minimization
        (placeholder for future integration with DFT calculators)
        """
        # Generate initial structure
        structure = self.generate_structure_cvae(spacegroup_idx, comp_dict, num_atoms, temperature)
        
        # TODO: Add energy minimization
        # This could integrate with:
        # - ASE calculators
        # - VASP calculations
        # - Machine learning potentials
        
        return structure

def create_cvae_generator():
    """Create and return a CVAE generator instance"""
    # Try to find a trained model
    model_paths = [
        "./checkpoints/cvae_best.pt",
        "../backend/checkpoints/cvae_best.pt",
        "../checkpoints/cvae_best.pt",
        "./cvae_best.pt"
    ]
    
    generator = CVAEGenerator()
    
    for path in model_paths:
        if os.path.exists(path):
            if generator.load_model(path):
                break
    
    if not generator.model_loaded:
        print("⚠️ No trained CVAE model found. Using fallback generator.")
        print("📝 To train a model: python train_cvae.py")
    
    return generator

# Fallback generator for when model is not available
def generate_structure_fallback(spacegroup_idx, comp_dict, num_atoms=8, temperature=1.0):
    """
    Fallback structure generator (enhanced dummy generator)
    Used when CVAE model is not available
    """
    print(f"🔄 Using fallback generator for SG={spacegroup_idx}, composition={comp_dict}")
    
    # Calculate lattice parameters based on composition and space group
    base_length = max(5.0 + (num_atoms * 0.2), 8.0)
    
    # Adjust for space group
    if spacegroup_idx >= 195:  # Cubic
        lattice_params = [base_length, base_length, base_length, 90.0, 90.0, 90.0]
    elif spacegroup_idx >= 75:  # Tetragonal
        lattice_params = [base_length, base_length, base_length * 1.1, 90.0, 90.0, 90.0]
    else:  # Other systems
        lattice_params = [base_length, base_length * 1.05, base_length * 1.1, 90.0, 90.0, 90.0]
    
    # Generate atomic positions
    elements = list(comp_dict.keys())
    atoms = []
    
    # Create a simple grid-based structure
    grid_size = int(np.ceil(num_atoms ** (1/3))) + 1
    spacing = 0.8 / grid_size
    
    atom_count = 0
    for element, amount in comp_dict.items():
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

if __name__ == "__main__":
    # Test the CVAE generator
    generator = create_cvae_generator()
    
    if generator.model_loaded:
        print("✅ Testing CVAE generation...")
        try:
            structure = generator.generate_structure_cvae(
                spacegroup_idx=225,
                comp_dict={'Na': 1, 'Cl': 1},
                num_atoms=2,
                temperature=1.0
            )
            print(f"✅ Generated structure: {structure.formula}")
            print(f"   Lattice: {structure.lattice.abc}")
            print(f"   Sites: {len(structure)}")
        except Exception as e:
            print(f"❌ CVAE generation failed: {e}")
    else:
        print("✅ Testing fallback generation...")
        structure = generate_structure_fallback(
            spacegroup_idx=225,
            comp_dict={'Na': 1, 'Cl': 1},
            num_atoms=2,
            temperature=1.0
        )
        print(f"✅ Generated fallback structure with {len(structure['atoms'])} atoms")
