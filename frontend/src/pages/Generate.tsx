import React, { useState, useEffect, useRef } from 'react';
import { 
  Atom, 
  Download, 
  Loader2, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Sliders,
  Eye,
  FileText,
  Code,
  Database
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

// Type definitions
interface LatticeParameters {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  volume: number;
}

interface AtomData {
  element: string;
  position: number[];
  frac_coords: number[];
}

interface ValidationReport {
  formula: string;
  spacegroup: number;
  timestamp: string;
  validations: {
    lattice_parameters: {
      valid: boolean;
      error?: string;
      violations: string[];
    };
    coordinate_bounds: {
      valid: boolean;
      error?: string;
      violations: string[];
    };
    interatomic_distances: {
      valid: boolean;
      error?: string;
      violations: string[];
    };
  };
  overall_valid: boolean;
  critical_errors: string[];
  warnings: string[];
}

interface StructureResponse {
  success: boolean;
  formula?: string;
  spacegroup: number;
  lattice_parameters?: LatticeParameters;
  atoms?: AtomData[];
  xyz_data?: string;
  cif_data?: string;
  validation_report?: ValidationReport;
  error?: string;
}

interface CompositionEntry {
  element: string;
  amount: number;
}

const Generate: React.FC = () => {
  const [spacegroup, setSpacegroup] = useState<number>(225);
  const [composition, setComposition] = useState<CompositionEntry[]>([
    { element: 'Fe', amount: 1 },
    { element: 'O', amount: 1 }
  ]);
  const [numAtoms, setNumAtoms] = useState<number>(8);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [newElement, setNewElement] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StructureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableElements, setAvailableElements] = useState<string[]>([]);
  const [viewerLoaded, setViewerLoaded] = useState<boolean>(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  // const API_URL = API_ENDPOINTS.GENERATE.substring(0, API_ENDPOINTS.GENERATE.lastIndexOf('/'));

  const defaultElements = [
    'H','He','Li','Be','B','C','N','O','F','Ne',
    'Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Ti','Fe'
  ];

  // Load 3Dmol.js library
  useEffect(() => {
    const load3Dmol = () => {
      if ((window as any).$3Dmol) {
        setViewerLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js';
      script.async = false;
      script.onload = () => {
        console.log('3Dmol.js loaded successfully');
        setViewerLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load 3Dmol.js');
        setError('Failed to load 3D visualization library');
      };
      document.head.appendChild(script);
    };

    load3Dmol();
  }, []);

  // Fetch available elements
  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.ELEMENTS}?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
        setAvailableElements(data.elements || defaultElements);
      } catch (err) {
        console.error('Failed to fetch elements:', err);
        setAvailableElements(defaultElements);
      }
    };

    fetchElements();
  }, []);

  // Initialize 3D viewer when result changes
  useEffect(() => {
    if (result && result.xyz_data && viewerLoaded && viewerRef.current) {
      initializeViewer(result.xyz_data);
    }
  }, [result, viewerLoaded]);

  const initializeViewer = (xyzData: string) => {
    try {
      if (!viewerRef.current || !(window as any).$3Dmol) {
        console.error('Viewer not ready');
        return;
      }

      // Clear previous viewer
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.clear();
      }

      viewerRef.current.innerHTML = '';
      
      const config = {
        backgroundColor: '#f8f9fa',
        antialias: true,
      };
      
      const viewer = (window as any).$3Dmol.createViewer(viewerRef.current, config);
      viewerInstanceRef.current = viewer;
      
      viewer.addModel(xyzData, 'xyz');
      viewer.setStyle({}, {
        sphere: { radius: 0.5, color: 'spectrum' },
        stick: { radius: 0.15, color: 'grey' }
      });
      
      viewer.setBackgroundColor('#f8f9fa');
      viewer.zoomTo();
      viewer.render();
      viewer.zoom(1.3, 1000);
      
      console.log('3D viewer initialized successfully');
    } catch (err) {
      console.error('Error initializing viewer:', err);
      setError('Failed to render 3D structure');
    }
  };

  const handleAddElement = () => {
    if (newElement && availableElements.includes(newElement)) {
      const existingIndex = composition.findIndex(c => c.element === newElement);
      if (existingIndex >= 0) {
        const updated = [...composition];
        updated[existingIndex].amount = newAmount;
        setComposition(updated);
      } else {
        setComposition([...composition, { element: newElement, amount: newAmount }]);
      }
      setNewElement('');
      setNewAmount(1);
    }
  };

  const handleRemoveElement = (index: number) => {
    setComposition(composition.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (composition.length === 0) {
      setError('Please add at least one element to the composition');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const compositionDict: Record<string, number> = {};
      composition.forEach(c => {
        compositionDict[c.element] = c.amount;
      });

      console.log('Sending request to:', API_ENDPOINTS.GENERATE);
      console.log('Request data:', {
        spacegroup,
        composition: compositionDict,
        num_atoms: numAtoms,
        temperature
      });

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`${API_ENDPOINTS.GENERATE}?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          spacegroup: spacegroup,
          composition: compositionDict,
          num_atoms: numAtoms,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StructureResponse = await response.json();
      console.log('Response:', data);

      if (data.success) {
        setResult(data);
        setError(null);
        console.log('✅ Structure generation completed successfully');
      } else {
        setError(data.error || 'Failed to generate structure');
        setResult(null);
      }
    } catch (err: any) {
      console.error('❌ API request failed:', err);
      setError(`Failed to connect to API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCIF = () => {
    if (result && result.cif_data) {
      const blob = new Blob([result.cif_data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.formula}_sg${result.spacegroup}.cif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadXYZ = () => {
    if (result && result.xyz_data) {
      const blob = new Blob([result.xyz_data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.formula}_sg${result.spacegroup}.xyz`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadJSON = () => {
    if (result) {
      const jsonData = {
        formula: result.formula,
        spacegroup: result.spacegroup,
        lattice_parameters: result.lattice_parameters,
        atoms: result.atoms,
        composition: composition.reduce((acc, comp) => {
          acc[comp.element] = comp.amount;
          return acc;
        }, {} as Record<string, number>),
        generated_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.formula}_sg${result.spacegroup}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPOSCAR = () => {
    if (result && result.lattice_parameters && result.atoms) {
      const lattice = result.lattice_parameters;
      const atoms = result.atoms;
      
      // Create POSCAR format for VASP
      let poscarContent = `${result.formula} - Generated Structure\n1.0\n`;
      poscarContent += `${(lattice.a || 0).toFixed(8)} 0.00000000 0.00000000\n`;
      poscarContent += `0.00000000 ${(lattice.b || 0).toFixed(8)} 0.00000000\n`;
      poscarContent += `0.00000000 0.00000000 ${(lattice.c || 0).toFixed(8)}\n`;
      
      // Count unique elements and atoms
      const elementCounts: Record<string, number> = {};
      atoms.forEach(atom => {
        elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
      });
      
      const elements = Object.keys(elementCounts);
      const counts = elements.map(el => elementCounts[el]);
      
      poscarContent += `${elements.join(' ')}\n`;
      poscarContent += `${counts.join(' ')}\n`;
      poscarContent += "Selective dynamics\nDirect\n";
      
      // Add fractional coordinates
      atoms.forEach(atom => {
        const coords = (atom.frac_coords || []).map(coord => (coord || 0).toFixed(8)).join(' ');
        poscarContent += `${coords} T T T\n`;
      });
      
      const blob = new Blob([poscarContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.formula}_sg${result.spacegroup}_POSCAR`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const presetCompositions = [
    { label: 'FeO', elements: [{ element: 'Fe', amount: 1 }, { element: 'O', amount: 1 }] },
    { label: 'TiO₂', elements: [{ element: 'Ti', amount: 1 }, { element: 'O', amount: 2 }] },
    { label: 'NaCl', elements: [{ element: 'Na', amount: 1 }, { element: 'Cl', amount: 1 }] },
    { label: 'SiO₂', elements: [{ element: 'Si', amount: 1 }, { element: 'O', amount: 2 }] },
  ];

  const applyPreset = (preset: typeof presetCompositions[0]) => {
    setComposition(preset.elements);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-darker via-neon-dark to-neon-light p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <img src="/logo.jpeg" alt="CrystalGen Logo" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-neon-pulse" />
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
              Crystal Structure Generator
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-3 sm:px-4">
            Generate crystal structures using AI-powered CVAE model with 3D visualization
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-neon-purple/20">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <Sliders className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-neon-cyan" />
                Configuration
              </h2>

              <div className="space-y-4 sm:space-y-6">
                {/* Space Group */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1 sm:mb-2">
                    Space Group (1-230)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="230"
                    value={spacegroup}
                    onChange={(e) => setSpacegroup(parseInt(e.target.value) || 1)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/50 border border-neon-purple/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan transition-all text-base sm:text-lg text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                    Common: 225 (Fm-3m), 194 (P6₃/mmc), 221 (Pm-3m)
                  </p>
                </div>

                {/* Composition */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Chemical Composition
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {presetCompositions.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyPreset(preset)}
                        className="px-3 py-1 text-sm bg-black/50 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/10 hover:border-neon-cyan/60 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 mb-3">
                    <select
                      value={newElement}
                      onChange={(e) => setNewElement(e.target.value)}
                      className="flex-1 px-4 py-2 bg-black/50 border border-neon-purple/30 rounded-xl focus:ring-2 focus:ring-neon-cyan text-white"
                    >
                      <option value="">Select element</option>
                      {availableElements.map((el) => (
                        <option key={el} value={el}>{el}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={newAmount}
                      onChange={(e) => setNewAmount(parseFloat(e.target.value) || 1)}
                      className="w-20 px-3 py-2 bg-black/50 border border-neon-purple/30 rounded-xl focus:ring-2 focus:ring-neon-cyan text-white"
                    />
                    <button
                      onClick={handleAddElement}
                      disabled={!newElement}
                      className="px-4 py-2 bg-neon-gradient text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {composition.map((comp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-black/50 border border-neon-cyan/30 px-4 py-2 rounded-full"
                      >
                        <span className="font-bold text-neon-cyan">{comp.element}</span>
                        <span className="text-sm text-gray-300">{comp.amount}</span>
                        <button
                          onClick={() => handleRemoveElement(idx)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Number of Atoms */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Number of Atoms: <span className="text-neon-cyan">{numAtoms}</span>
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    value={numAtoms}
                    onChange={(e) => setNumAtoms(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>4</span>
                    <span>32</span>
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Temperature: <span className="text-neon-cyan">{temperature.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0.1</span>
                    <span>2.0</span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || composition.length === 0}
                  className="w-full py-4 bg-neon-gradient text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Atom className="w-6 h-6" />
                      Generate Structure
                    </>
                  )}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {result ? (
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                    Generated Structure
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadXYZ}
                      className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm"
                      title="Download XYZ format"
                    >
                      <Code className="w-4 h-4" />
                      XYZ
                    </button>
                    <button
                      onClick={handleDownloadCIF}
                      className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 text-sm"
                      title="Download CIF format"
                    >
                      <FileText className="w-4 h-4" />
                      CIF
                    </button>
                    <button
                      onClick={handleDownloadJSON}
                      className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 text-sm"
                      title="Download JSON format"
                    >
                      <Database className="w-4 h-4" />
                      JSON
                    </button>
                    <button
                      onClick={handleDownloadPOSCAR}
                      className="px-3 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center gap-2 text-sm"
                      title="Download POSCAR format (VASP)"
                    >
                      <Download className="w-4 h-4" />
                      POSCAR
                    </button>
                  </div>
                </div>

                {/* 3D Viewer */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    3D Visualization
                  </h3>
                  <div
                    ref={viewerRef}
                    className="w-full h-80 md:h-96 border-4 border-gray-200 rounded-2xl bg-gray-50"
                    style={{ position: 'relative' }}
                  >
                    {!viewerLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Structure Info */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Formula</p>
                        <p className="text-lg font-bold text-indigo-900">{result.formula}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Space Group</p>
                        <p className="text-lg font-bold text-indigo-900">{result.spacegroup}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Atoms</p>
                        <p className="text-lg font-bold text-indigo-900">{result.atoms?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Volume</p>
                        <p className="text-lg font-bold text-indigo-900">
                          {result.lattice_parameters?.volume?.toFixed(2) || 'N/A'} Å³
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lattice Parameters */}
                  {result.lattice_parameters && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-100 border-2 border-indigo-200 rounded-xl p-5">
                      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-700" />
                        <span className="text-indigo-800">Lattice Parameters</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['a', 'b', 'c'].map((param) => (
                          <div key={param} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <p className="text-xs font-semibold text-indigo-600 uppercase">{param}</p>
                            <p className="text-base font-bold text-indigo-900">
                              {result.lattice_parameters?.[param as keyof LatticeParameters]?.toFixed(3) || 'N/A'} Å
                            </p>
                          </div>
                        ))}
                        {['alpha', 'beta', 'gamma'].map((param) => (
                          <div key={param} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <p className="text-xs font-semibold text-indigo-600 uppercase">{param}</p>
                            <p className="text-base font-bold text-indigo-900">
                              {result.lattice_parameters?.[param as keyof LatticeParameters]?.toFixed(1) || 'N/A'}°
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Atoms Table */}
                  {result.atoms && result.atoms.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200 rounded-xl p-5">
                      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-700" />
                        <span className="text-purple-800">Atomic Positions</span>
                      </h3>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0 border-b-2 border-gray-200">
                            <tr>
                              <th className="px-3 py-3 text-left font-bold text-gray-700">#</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-700">Element</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-700">X (Å)</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-700">Y (Å)</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-700">Z (Å)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.atoms.map((atom, idx) => (
                              <tr key={idx} className="border-t border-purple-200 hover:bg-purple-50 transition-colors">
                                <td className="px-3 py-3 font-bold text-gray-900 bg-white bg-opacity-60">{idx + 1}</td>
                                <td className="px-3 py-3 font-bold text-purple-900 bg-white bg-opacity-60">{atom.element}</td>
                                <td className="px-3 py-3 font-mono font-semibold text-gray-900 bg-white bg-opacity-60">{atom.position?.[0]?.toFixed(3) || '0.000'}</td>
                                <td className="px-3 py-3 font-mono font-semibold text-gray-900 bg-white bg-opacity-60">{atom.position?.[1]?.toFixed(3) || '0.000'}</td>
                                <td className="px-3 py-3 font-mono font-semibold text-gray-900 bg-white bg-opacity-60">{atom.position?.[2]?.toFixed(3) || '0.000'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Export Formats Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-5">
                    <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5 text-blue-700" />
                      <span className="text-blue-800">Export Formats</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0 shadow-sm"></div>
                        <div>
                          <span className="font-bold text-blue-800">XYZ:</span>
                          <span className="text-gray-700 block mt-1"> Standard coordinate format for molecular visualization</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
                        <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0 shadow-sm"></div>
                        <div>
                          <span className="font-bold text-green-800">CIF:</span>
                          <span className="text-gray-700 block mt-1"> Crystallographic Information File for crystal structures</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                        <div className="w-4 h-4 bg-purple-500 rounded-full mt-0.5 flex-shrink-0 shadow-sm"></div>
                        <div>
                          <span className="font-bold text-purple-800">JSON:</span>
                          <span className="text-gray-700 block mt-1"> Complete data structure with all parameters</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100">
                        <div className="w-4 h-4 bg-orange-500 rounded-full mt-0.5 flex-shrink-0 shadow-sm"></div>
                        <div>
                          <span className="font-bold text-orange-800">POSCAR:</span>
                          <span className="text-gray-700 block mt-1"> VASP format for computational materials science</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Report */}
                  {result.validation_report && (
                    <div className={`rounded-xl p-5 border-2 ${
                      result.validation_report.overall_valid 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300' 
                        : 'bg-gradient-to-br from-red-50 to-pink-100 border-red-300'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full shadow-sm ${
                            result.validation_report.overall_valid ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-gray-900 font-bold">
                            Validation Report
                          </span>
                        </h3>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-bold text-gray-700">Overall Status:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                            result.validation_report.overall_valid 
                              ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                              : 'bg-red-500 text-white border-red-600 shadow-sm'
                          }`}>
                            {result.validation_report.overall_valid ? '✅ VALID' : '❌ INVALID'}
                          </span>
                        </div>
                      </div>

                      {/* Validation Categories */}
                      <div className="mb-4">
                        <h4 className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                          Basic Safety Validation
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(['lattice_parameters', 'coordinate_bounds', 'interatomic_distances'] as const).map((key) => {
                            const validation = result.validation_report?.validations?.[key];
                            return (
                              <div key={key} className={`p-4 rounded-lg border-2 shadow-md transition-all hover:shadow-lg ${
                                validation?.valid
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300' 
                                  : 'bg-gradient-to-br from-red-50 to-pink-100 border-red-300'
                              }`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                                    validation?.valid ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span className={`font-bold text-sm capitalize ${
                                    validation?.valid ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {key.replace('_', ' ')}
                                  </span>
                                </div>
                                {validation?.error && (
                                  <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded border border-red-200">
                                    {validation.error}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Critical Errors */}
                      {result.validation_report.critical_errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-bold text-sm mb-2 text-red-800 flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                            Critical Errors:
                          </h4>
                          <div className="bg-gradient-to-br from-red-50 to-pink-100 border-2 border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                            {result.validation_report.critical_errors.map((error, idx) => (
                              <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <span className="text-sm text-red-800 font-medium">{error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {result.validation_report.warnings.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-bold text-sm mb-2 text-yellow-800 flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                            Warnings:
                          </h4>
                          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                            {result.validation_report.warnings.map((warning, idx) => (
                              <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <span className="text-sm text-yellow-800 font-medium">{warning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Validation Timestamp */}
                      <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        <span className="font-medium">Validated:</span> {new Date(result.validation_report.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
                  <Atom className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  Ready to Generate
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Configure parameters and click generate to create a crystal structure
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;