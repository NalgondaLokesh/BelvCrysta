#!/usr/bin/env python3
"""
Quick test to verify the Flask API routes are working correctly
"""
import requests
import json

def test_api():
    base_url = "http://localhost:5000"
    
    print("🧪 Testing BelvCrysta API...")
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ Server is running: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Server not running: {e}")
        return False
    
    # Test 2: Get elements
    try:
        response = requests.get(f"{base_url}/api/elements", timeout=5)
        print(f"✅ Elements endpoint: {len(response.json()['elements'])} elements available")
    except requests.exceptions.RequestException as e:
        print(f"❌ Elements endpoint failed: {e}")
        return False
    
    # Test 3: Generate structure (without auth for testing)
    test_data = {
        "spacegroup": 225,
        "composition": {"Na": 1, "Cl": 1},
        "num_atoms": 2,
        "temperature": 1.0,
        "token": "test_token"  # This will fail auth but we can see the structure generation
    }
    
    try:
        response = requests.post(f"{base_url}/api/generate", 
                               json=test_data, 
                               timeout=10)
        print(f"📊 Generate endpoint status: {response.status_code}")
        
        if response.status_code == 401:
            print("⚠️  Auth failed (expected), but route is working")
        elif response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Structure generated successfully!")
                print(f"   Formula: {result.get('formula')}")
                print(f"   Spacegroup: {result.get('spacegroup')}")
                print(f"   Atoms: {len(result.get('atoms', []))}")
                if result.get('lattice_parameters'):
                    print(f"   Lattice a: {result['lattice_parameters'].get('a', 'N/A')} Å")
            else:
                print(f"❌ Generation failed: {result.get('error')}")
        else:
            print(f"❌ Unexpected response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Generate endpoint failed: {e}")
        return False
    
    print("✅ API test completed!")
    return True

if __name__ == "__main__":
    test_api()
