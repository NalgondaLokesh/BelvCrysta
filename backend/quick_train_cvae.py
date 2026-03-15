#!/usr/bin/env python3
"""
Quick CVAE Model Training for Testing
Creates a basic trained model for the CrystalGen system
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import os
from datetime import datetime

# Import the actual CVAE from train_cvae.py
from train_cvae import CVAE, SyntheticCrystalDataset

def quick_train():
    """Quick training to create a testable model"""
    print("🚀 Quick CVAE Training for Testing")
    print("=" * 50)
    
    # Create checkpoint directory
    os.makedirs("./checkpoints", exist_ok=True)
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"📱 Using device: {device}")
    
    # Create small dataset for quick training
    print("📊 Creating small dataset...")
    dataset = SyntheticCrystalDataset(num_samples=100)  # Small dataset
    train_loader = DataLoader(dataset, batch_size=8, shuffle=True)
    
    # Create model
    print("🧠 Creating CVAE model...")
    model = CVAE().to(device)
    
    # Optimizer
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    
    # Quick training (just 5 epochs)
    print("🎯 Starting quick training (5 epochs)...")
    model.train()
    
    for epoch in range(1, 6):
        total_loss = 0
        num_batches = len(train_loader)
        
        for batch_idx, batch in enumerate(train_loader):
            # Extract data from dictionary
            lattice = batch['lattice'].to(device)
            species_oh = batch['species_oh'].to(device)
            frac = batch['frac'].to(device)
            sg_idx = batch['sg_idx'].to(device)
            
            optimizer.zero_grad()
            
            # Forward pass
            mu, logvar = model.enc(lattice, frac, species_oh, sg_idx)
            z = model.reparameterize(mu, logvar)
            lat_pred, frac_pred, species_logits = model.dec(z, sg_idx)
            
            # Simple loss (MSE for now)
            lattice_loss = F.mse_loss(lat_pred, lattice.view(-1, 3, 3))
            frac_loss = F.mse_loss(frac_pred, frac)
            species_loss = F.cross_entropy(species_logits.view(-1, 22), species_oh.argmax(dim=1))
            kl_loss = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
            
            loss = lattice_loss + frac_loss + species_loss + 0.1 * kl_loss
            
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        avg_loss = total_loss / len(train_loader.dataset)
        print(f"Epoch {epoch}: Average loss = {avg_loss:.4f}")
    
    # Save the model
    print("💾 Saving model...")
    checkpoint = {
        'epoch': 5,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': avg_loss,
        'timestamp': datetime.now().isoformat()
    }
    
    torch.save(checkpoint, "./checkpoints/cvae_latest.pt")
    torch.save(checkpoint, "./checkpoints/cvae_best.pt")
    
    print("✅ Model saved successfully!")
    print("📁 Location: ./checkpoints/cvae_latest.pt")
    
    # Test the model
    print("\n🧪 Testing model...")
    model.eval()
    with torch.no_grad():
        z = torch.randn((1, 128), device=device)
        sg_idx = torch.tensor([225], device=device)
        
        lat_pred, frac_pred, species_logits = model.dec(z, sg_idx)
        
        print(f"✅ Model test passed!")
        print(f"   Lattice prediction shape: {lat_pred.shape}")
        print(f"   Fractional coords shape: {frac_pred.shape}")
        print(f"   Species logits shape: {species_logits.shape}")
    
    print("\n🎉 Quick training completed!")
    print("🚀 The system can now use the CVAE model for generation!")

if __name__ == "__main__":
    quick_train()
