#!/usr/bin/env python3
"""
Enhanced CVAE Training Script for Crystal Structure Generation
This script trains a Crystal Variational Autoencoder for generating realistic crystal structures
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np
import pandas as pd
import json
import os
import math
from datetime import datetime
import random

# Model Constants
LATENT_DIM = 64
N_ELEM = 22  # Number of elements in training
ELEMENTS = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Ti','Fe']
EL_TO_IDX = {e: i for i, e in enumerate(ELEMENTS)}

class CVAE(nn.Module):
    """Crystal Variational Autoencoder"""
    
    def __init__(self, n_elem=N_ELEM, latent_dim=LATENT_DIM):
        super(CVAE, self).__init__()
        self.n_elem = n_elem
        self.latent_dim = latent_dim
        
        # Space group embedding
        self.sg_embedding = nn.Embedding(231, 32)  # 230 space groups + 1 for padding
        
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(3 + n_elem + 32, 256),  # lattice (3) + species_onehot + sg_embedding
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64)
        )
        
        # Latent space
        self.fc_mu = nn.Linear(64, latent_dim)
        self.fc_logvar = nn.Linear(64, latent_dim)
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim + 32, 128),  # latent + sg_embedding
            nn.ReLU(),
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Linear(256, 3 + n_elem + 8 * n_elem)  # lattice (3) + species_logits + frac_coords (8 atoms)
        )
    
    def encode(self, lattice, species_onehot, sg_idx):
        """Encode crystal structure to latent space"""
        sg_embed = self.sg_embedding(sg_idx)
        x = torch.cat([lattice, species_onehot, sg_embed], dim=1)
        h = self.encoder(x)
        return self.fc_mu(h), self.fc_logvar(h)
    
    def reparameterize(self, mu, logvar):
        """Reparameterization trick"""
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std
    
    def decode(self, z, sg_idx):
        """Decode latent vector to crystal structure"""
        sg_embed = self.sg_embedding(sg_idx)
        x = torch.cat([z, sg_embed], dim=1)
        output = self.decoder(x)
        
        # Split output
        lattice_pred = output[:, :3]
        species_logits = output[:, 3:3+n_elem]
        frac_pred = output[:, 3+n_elem:].view(-1, 8, n_elem)  # Reshape for 8 atoms
        
        return lattice_pred, species_logits, frac_pred
    
    def forward(self, lattice, species_onehot, sg_idx):
        """Forward pass"""
        mu, logvar = self.encode(lattice, species_onehot, sg_idx)
        z = self.reparameterize(mu, logvar)
        return self.decode(z, sg_idx), mu, logvar

class SyntheticCrystalDataset(Dataset):
    """Synthetic crystal dataset for training"""
    
    def __init__(self, num_samples=1000):
        self.num_samples = num_samples
        self.data = []
        self._generate_synthetic_data()
    
    def _generate_synthetic_data(self):
        """Generate synthetic crystal structures"""
        print("🔬 Generating synthetic crystal dataset...")
        
        for i in range(self.num_samples):
            # Random space group (common ones)
            spacegroups = [225, 194, 191, 164, 152, 141, 123, 62, 47, 15]  # Common space groups
            sg_idx = random.choice(spacegroups)
            
            # Random composition (2-4 elements)
            num_elements = random.randint(2, 4)
            elements = random.sample(ELEMENTS[:15], num_elements)  # Use first 15 elements
            
            # Random lattice parameters
            if sg_idx >= 195:  # Cubic
                a = random.uniform(3.0, 10.0)
                lattice = [a, a, a, 90.0, 90.0, 90.0]
            elif sg_idx >= 75:  # Tetragonal
                a = random.uniform(3.0, 10.0)
                c = random.uniform(3.0, 12.0)
                lattice = [a, a, c, 90.0, 90.0, 90.0]
            else:  # Other systems
                a = random.uniform(3.0, 10.0)
                b = random.uniform(3.0, 10.0)
                c = random.uniform(3.0, 12.0)
                lattice = [a, b, c, 90.0, 90.0, 90.0]
            
            # Random species (one-hot)
            species_oh = np.zeros(8, N_ELEM)
            for j in range(8):
                species_oh[j, random.randint(0, N_ELEM)] = 1.0
            
            # Random fractional coordinates
            frac = np.random.rand(8, 3)
            
            self.data.append({
                'lattice': torch.FloatTensor(lattice),
                'species_oh': torch.FloatTensor(species_oh),
                'frac': torch.FloatTensor(frac),
                'sg_idx': torch.LongTensor([sg_idx])
            })
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        return (
            item['lattice'],
            item['species_oh'].view(-1),  # Flatten
            item['frac'].view(-1),  # Flatten
            item['sg_idx'].squeeze()
        )

def loss_function(lattice_rec, frac_rec, species_logits, 
                  lattice, frac, species_oh, mu, logvar):
    """CVAE loss function"""
    # Reconstruction losses
    lattice_loss = F.mse_loss(lattice_rec, lattice, reduction='sum')
    frac_loss = F.mse_loss(frac_rec, frac, reduction='sum')
    species_loss = F.cross_entropy(species_logits, species_oh.argmax(dim=1), reduction='sum')
    
    # KL divergence
    kl_loss = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    
    total_loss = lattice_loss + frac_loss + species_loss + 0.1 * kl_loss
    
    return total_loss, lattice_loss, frac_loss, species_loss, kl_loss

def train_cvae(model, train_loader, optimizer, device, epoch):
    """Train the CVAE model for one epoch"""
    model.train()
    train_loss = 0
    num_batches = len(train_loader)
    
    for batch_idx, (lattice, species_oh, frac, sg_idx) in enumerate(train_loader):
        lattice = lattice.to(device)
        species_oh = species_oh.to(device)
        frac = frac.to(device)
        sg_idx = sg_idx.to(device)
        
        optimizer.zero_grad()
        
        # Forward pass
        (lattice_rec, species_logits, frac_rec), mu, logvar = model(lattice, species_oh, sg_idx)
        
        # Calculate loss
        loss, lattice_loss, frac_loss, species_loss, kl_loss = loss_function(
            lattice_rec, frac_rec, species_logits, lattice, frac, species_oh, mu, logvar
        )
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        train_loss += loss.item()
        
        # Print progress
        if batch_idx % 50 == 0:
            print(f'Epoch {epoch} [{batch_idx}/{num_batches}]\t'
                  f'Loss: {loss.item()/len(lattice):.4f}\t'
                  f'Lattice: {lattice_loss.item()/len(lattice):.4f}\t'
                  f'Frac: {frac_loss.item()/len(lattice):.4f}\t'
                  f'Species: {species_loss.item()/len(lattice):.4f}\t'
                  f'KL: {kl_loss.item()/len(lattice):.4f}')
    
    avg_loss = train_loss / len(train_loader.dataset)
    print(f'====> Epoch: {epoch} Average loss: {avg_loss:.4f}')
    return avg_loss

def create_checkpoint_directory():
    """Create checkpoint directory"""
    checkpoint_dir = "./checkpoints"
    os.makedirs(checkpoint_dir, exist_ok=True)
    return checkpoint_dir

def save_checkpoint(model, optimizer, epoch, loss, checkpoint_dir):
    """Save model checkpoint"""
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save latest
    torch.save(checkpoint, os.path.join(checkpoint_dir, 'cvae_latest.pt'))
    
    # Save best
    if not hasattr(save_checkpoint, 'best_loss') or loss < save_checkpoint.best_loss:
        save_checkpoint.best_loss = loss
        torch.save(checkpoint, os.path.join(checkpoint_dir, 'cvae_best.pt'))
        print(f"✅ New best model saved with loss: {loss:.4f}")

def main():
    """Main training function"""
    print("🚀 Starting CVAE Training for Crystal Structure Generation")
    print("=" * 60)
    
    # Set random seeds
    torch.manual_seed(42)
    np.random.seed(42)
    random.seed(42)
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"📱 Using device: {device}")
    
    # Create checkpoint directory
    checkpoint_dir = create_checkpoint_directory()
    
    # Create dataset and dataloader
    print("📊 Creating dataset...")
    dataset = SyntheticCrystalDataset(num_samples=2000)
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    print(f"✅ Dataset created with {len(dataset)} samples")
    
    # Create model
    print("🧠 Creating CVAE model...")
    model = CVAE(n_elem=N_ELEM, latent_dim=LATENT_DIM).to(device)
    
    # Optimizer
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    
    # Training parameters
    num_epochs = 50
    
    print(f"🎯 Starting training for {num_epochs} epochs...")
    print("=" * 60)
    
    # Training loop
    best_loss = float('inf')
    for epoch in range(1, num_epochs + 1):
        loss = train_cvae(model, train_loader, optimizer, device, epoch)
        
        # Save checkpoint
        save_checkpoint(model, optimizer, epoch, loss, checkpoint_dir)
        
        # Learning rate scheduling
        if epoch % 10 == 0:
            for param_group in optimizer.param_groups:
                param_group['lr'] *= 0.5
            print(f"📉 Learning rate reduced to {optimizer.param_groups[0]['lr']}")
    
    print("=" * 60)
    print("🎉 Training completed!")
    print(f"📁 Checkpoints saved in: {checkpoint_dir}")
    print(f"🏆 Best loss: {save_checkpoint.best_loss:.4f}")
    
    # Test the model
    print("\n🧪 Testing trained model...")
    model.eval()
    with torch.no_grad():
        # Generate a test structure
        z = torch.randn((1, LATENT_DIM), device=device)
        sg_idx = torch.tensor([225], device=device)  # Fm-3m (NaCl structure)
        
        lattice_pred, species_logits, frac_pred = model.decode(z, sg_idx)
        
        print(f"Generated lattice: {lattice_pred.cpu().numpy()[0]}")
        print(f"Generated species shape: {species_logits.shape}")
        print(f"Generated fractional coords shape: {frac_pred.shape}")
    
    print("✅ Model test completed successfully!")

if __name__ == "__main__":
    main()
