🧊 BelvCrysta: AI-Powered Crystal Structure Generation Platform

BelvCrysta is an AI-powered web platform designed for generating and exploring crystal structures using machine learning. The system integrates deep learning models with materials science tools to generate plausible crystal structures based on user-defined parameters such as space group, composition, and unit cell size.

The platform enables users to generate, visualize, and export crystal structures through an interactive web interface, providing an accessible environment for computational materials exploration.

🌐 Project Overview

BelvCrysta combines machine learning, crystallography, and modern web technologies to provide an end-to-end system for crystal structure generation.

The platform integrates:

- Deep Learning (CVAE) for generative modeling of crystal structures
- Pymatgen for crystal structure construction and validation
- Flask Backend for API services and model inference
- React / Web Frontend for interactive user interface
- 3D Visualization Tools for displaying generated structures

Users can configure structural parameters and instantly generate crystal structures that can be visualized and exported in standard scientific formats.

🏗️ Project Structure

```
CrystalGen/
│
├── BelvCrysta/                 # Frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   ├── generate.tsx
│   │   │   └── history.tsx
│   │   ├── utils/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── tailwind.config.js
│
├── model/                      # Backend and ML model
│   ├── routes/
│   │   ├── auth_routes.py
│   │   └── crystal_routes.py
│   │
│   ├── checkpoints/            # Trained model files
│   │   ├── cvae_best.pt
│   │   └── cvae_latest.pt
│   │
│   ├── app.py                  # Flask server
│   ├── train_cvae.py           # Model training script
│   └── requirements.txt
│
└── README.md
```

⚙️ Installation Guide

1️⃣ Clone the Repository

```bash
git clone https://github.com/NalgondaLokesh/BelvCrysta.git
cd BelvCrysta
```

2️⃣ Install Python Dependencies

```bash
pip install flask flask-cors flask-bcrypt pyjwt pymongo ase pymatgen
```

3️⃣ Install Visualization Dependencies

```bash
npm install 3dmol
```

4️⃣ Run the Backend Server

```bash
cd model
python app.py
```

The Flask server will start and expose the API for crystal generation.

🧠 Model Description

BelvCrysta uses a Conditional Variational Autoencoder (CVAE) to generate crystal structures.

The model learns patterns in crystal structures and uses this learned representation to generate new structures conditioned on user-provided parameters.

Model Components

- Encoder

  The encoder compresses crystal structure representations into a latent vector representation.

- Latent Space

  A stochastic latent space allows the model to generate diverse crystal structures while maintaining learned structural patterns.

- Decoder

  The decoder reconstructs crystal structures from the latent vector and conditioning parameters such as space group.

Model Output

The model generates:

- lattice parameters
- atomic fractional coordinates
- atomic species assignments

These outputs are used to construct complete crystal structures.

🔬 Crystal Generation Workflow

The structure generation pipeline follows several steps:

1️⃣ User defines generation parameters

- space group
- chemical composition
- number of atoms
- generation temperature

2️⃣ The system samples a latent representation.

3️⃣ The decoder generates predicted lattice vectors and atomic coordinates.

4️⃣ Generated outputs are converted into a crystal structure.

5️⃣ The structure is validated and prepared for visualization.

6️⃣ The final structure can be exported in scientific formats.

🧩 Web Interface

Home Page

Introduces the platform and provides access to authentication.

Authentication Pages

Users can register or log in to access generation features.

Generate Page

Users can configure parameters such as:

- Space Group (1-230)
- Element Composition
- Number of Atoms
- Generation Temperature

After submission, the system generates a crystal structure based on the selected parameters.

History Page

Authenticated users can view previously generated structures and download structure files.

🔍 API Routes

| Route | Method | Description |
|------|--------|-------------|
| `/api/generate` | POST | Generate a crystal structure |
| `/api/history` | GET | Retrieve previously generated structures |
| `/api/save` | POST | Save structure to database |
| `/api/delete` | DELETE | Remove stored structure |
| `/api/elements` | GET | Retrieve supported elements |

🧪 Scientific Libraries Used

BelvCrysta integrates several scientific libraries used in computational materials research.

- Pymatgen

  Used for constructing and validating crystal structures.

- ASE (Atomic Simulation Environment)

  Used for atomic structure manipulation and format conversions.

- PyTorch

  Used for implementing and training the deep learning model.

📦 Supported Output Formats

Generated crystal structures can be exported in multiple formats:

- CIF (Crystallographic Information File)
- XYZ format
- JSON representation

These formats allow structures to be used in simulation software or further analysis tools.

🎯 Project Use Cases

BelvCrysta can support several applications in computational materials science.

- Materials Discovery

  Generate candidate crystal structures for exploring new materials.

- Educational Tool

  Provide an interactive environment for learning crystallography and crystal symmetry.

- Computational Research

  Assist researchers in generating candidate crystal structures for simulation studies.

- Materials Database Expansion

  Generate structures that can be further analyzed and added to materials datasets.

- AI for Scientific Exploration

  Demonstrate the use of generative machine learning models in materials science.

🚀 Future Enhancements

Possible improvements for the platform include:

- property prediction models for generated materials
- advanced 3D visualization tools
- larger element coverage
- improved training datasets
- integration with materials science databases

⭐ Summary

BelvCrysta demonstrates the integration of machine learning, materials science, and modern web technologies to build a platform capable of generating crystal structures through an interactive interface.

The system provides a foundation for exploring AI-driven approaches to materials discovery while offering an accessible platform for researchers and students interested in computational crystallography.

🔗 Connect

- **GitHub**: https://github.com/NalgondaLokesh
- **LinkedIn**: https://www.linkedin.com/in/nalgonda-lokesh

