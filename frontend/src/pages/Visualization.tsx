import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Settings,
  Play,
  Pause,
  Atom
} from 'lucide-react';

interface Atom3D {
  id: number;
  element: string;
  position: number[];
  color: string;
  radius: number;
}

interface Bond3D {
  atom1: number;
  atom2: number;
  distance: number;
}

interface Structure3D {
  atoms: Atom3D[];
  bonds: Bond3D[];
  lattice: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
    volume: number;
    vectors: number[][];
  };
}

interface VisualizationProps {
  structure?: Structure3D;
  formula?: string;
}

const Visualization: React.FC<VisualizationProps> = ({ structure, formula }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // State (for UI toggles)
  const [isAnimating, setIsAnimating] = useState(true);
  const [showBonds, setShowBonds] = useState(true);
  const [showUnitCell, setShowUnitCell] = useState(true);
  const [viewMode, setViewMode] = useState<'ball-stick' | 'space-filling' | 'wireframe'>('ball-stick');
  const [zoom, setZoom] = useState(1);

  // Use refs for rotation to avoid re-rendering every frame
  const rotationXRef = useRef(0);
  const rotationYRef = useRef(0);

  // Keep a lightweight state if you want to display rotation somewhere (optional)
  // const [rotationPreview, setRotationPreview] = useState({ x: 0, y: 0 });

  // Resize canvas to match container & devicePixelRatio
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(200, Math.floor(rect.height * 0.65)); // keep some footer space

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !structure) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // helper color functions (kept from your original code)
    const lightenColor = (color: string, percent: number) => {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    };

    const darkenColor = (color: string, percent: number) => {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    };

    const render = () => {
      // ensure canvas size
      resizeCanvas();

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Project function
      const project = (x: number, y: number, z: number) => {
        const scale = 40 * zoom;
        const cosY = Math.cos(rotationYRef.current);
        const sinY = Math.sin(rotationYRef.current);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        const cosX = Math.cos(rotationXRef.current);
        const sinX = Math.sin(rotationXRef.current);
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const perspective = 400 / (400 + z2);

        return {
          x: centerX + x1 * scale * perspective,
          y: centerY + y1 * scale * perspective,
          z: z2,
          scale: perspective
        };
      };

      // Depth sort atoms
      const atomsWithDepth = structure.atoms.map(atom => ({
        atom,
        depth: project(atom.position[0], atom.position[1], atom.position[2]).z
      }));
      atomsWithDepth.sort((a, b) => a.depth - b.depth);

      // Draw bonds
      if (showBonds) {
        ctx.lineCap = 'round';
        structure.bonds.forEach(bond => {
          const atom1 = structure.atoms[bond.atom1];
          const atom2 = structure.atoms[bond.atom2];
          const pos1 = project(atom1.position[0], atom1.position[1], atom1.position[2]);
          const pos2 = project(atom2.position[0], atom2.position[1], atom2.position[2]);

          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2 * ((pos1.scale + pos2.scale) / 2);
          ctx.beginPath();
          ctx.moveTo(pos1.x, pos1.y);
          ctx.lineTo(pos2.x, pos2.y);
          ctx.stroke();
        });
      }

      // Unit cell
      if (showUnitCell && structure.lattice.vectors) {
        const origin = project(0, 0, 0);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        structure.lattice.vectors.forEach(vec => {
          const end = project(vec[0], vec[1], vec[2]);
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      // Atoms
      atomsWithDepth.forEach(({ atom }) => {
        const pos = project(atom.position[0], atom.position[1], atom.position[2]);
        let radius = atom.radius * 15 * pos.scale;
        if (viewMode === 'space-filling') {
          radius *= 2;
        } else if (viewMode === 'wireframe') {
          radius *= 0.3;
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(1, radius), 0, Math.PI * 2);

        if (viewMode !== 'wireframe') {
          const gradient = ctx.createRadialGradient(
            pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
            pos.x, pos.y, radius
          );
          gradient.addColorStop(0, lightenColor(atom.color, 40));
          gradient.addColorStop(1, atom.color);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.strokeStyle = darkenColor(atom.color, 20);
        ctx.lineWidth = 1;
        ctx.stroke();

        if (radius > 10) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.min(radius * 0.6, 16)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(atom.element, pos.x, pos.y);
        }
      });

      // Auto-rotate if animating
      if (isAnimating) {
        rotationYRef.current += 0.01;
        // optionally sync to state for UI feedback (throttle if you enable)
        // setRotationPreview({ x: rotationXRef.current, y: rotationYRef.current });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // start rendering
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure, zoom, isAnimating, showBonds, showUnitCell, viewMode]);

  // Mouse drag handlers for rotation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startRotX = 0;
    let startRotY = 0;

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      if (e instanceof TouchEvent) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = (e as MouseEvent).clientX;
        startY = (e as MouseEvent).clientY;
      }
      startRotX = rotationXRef.current;
      startRotY = rotationYRef.current;
      (canvas as HTMLCanvasElement).classList.add('cursor-grabbing');
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      let clientX = 0;
      let clientY = 0;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      rotationYRef.current = startRotY + deltaX * 0.01;
      rotationXRef.current = startRotX + deltaY * 0.01;
    };

    const onUp = () => {
      dragging = false;
      (canvas as HTMLCanvasElement).classList.remove('cursor-grabbing');
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    // touch support
    canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // Wheel to zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom(prev => Math.min(prev + 0.1, 3));
      } else {
        setZoom(prev => Math.max(prev - 0.1, 0.3));
      }
    };

    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, []);

  const handleReset = () => {
    rotationXRef.current = 0;
    rotationYRef.current = 0;
    setZoom(1);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3));

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${formula || 'structure'}_visualization.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // If no structure, render a placeholder UI (kept your original)
  if (!structure) {
    return (
      <div id="visualization-section" className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            3D Crystal Visualization
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Generate a structure to see interactive 3D visualization
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-20 text-center">
          <Atom className="w-20 h-20 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No structure loaded</p>
          <p className="text-slate-500 text-sm mt-2">Generate a crystal structure to visualize it in 3D</p>
        </div>
      </div>
    );
  }

  // Main JSX when structure exists
  return (
    <div id="visualization-section" className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
          3D Crystal Visualization
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Interactive visualization of {formula || 'generated structure'} - drag to rotate, scroll to zoom
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* View Controls */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>View Controls</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rendering Mode
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ball-stick">Ball & Stick</option>
                  <option value="space-filling">Space Filling</option>
                  <option value="wireframe">Wireframe</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showBonds}
                    onChange={(e) => setShowBonds(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span className="text-xs text-slate-700">Show Bonds</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showUnitCell}
                    onChange={(e) => setShowUnitCell(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span className="text-xs text-slate-700">Show Unit Cell</span>
                </label>
              </div>
            </div>
          </div>

          {/* Animation Controls */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Animation</h3>

            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`w-full p-2 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                isAnimating
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="text-sm font-medium">{isAnimating ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          {/* Structure Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Structure Info</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Formula:</span>
                <p className="font-medium text-slate-900">{formula}</p>
              </div>
              <div>
                <span className="text-slate-500">Atoms:</span>
                <p className="font-medium text-slate-900">{structure.atoms.length}</p>
              </div>
              <div>
                <span className="text-slate-500">Bonds:</span>
                <p className="font-medium text-slate-900">{structure.bonds.length}</p>
              </div>
              <div>
                <span className="text-slate-500">Volume:</span>
                <p className="font-medium text-slate-900">{structure.lattice.volume.toFixed(2)} Ų</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Viewer Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Atom className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-900">{formula}</span>
              </div>

              <div className="flex items-center space-x-1">
                <button 
                  onClick={handleReset}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleZoomIn}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button 
                  onClick={downloadImage}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div ref={containerRef} className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <canvas
                ref={canvasRef}
                onMouseDown={(e) => {/* handled in effect */}}
                className="w-full h-auto cursor-grab active:cursor-grabbing"
                style={{ display: 'block' }}
              />
              
              {/* Instructions Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                <p>🖱️ Drag to rotate • 🔍 Scroll to zoom</p>
              </div>
            </div>

            {/* Lattice Parameters Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
              <div className="grid grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">a:</span>
                  <p className="font-medium text-slate-900">{structure.lattice.a.toFixed(2)} Å</p>
                </div>
                <div>
                  <span className="text-slate-500">b:</span>
                  <p className="font-medium text-slate-900">{structure.lattice.b.toFixed(2)} Å</p>
                </div>
                <div>
                  <span className="text-slate-500">c:</span>
                  <p className="font-medium text-slate-900">{structure.lattice.c.toFixed(2)} Å</p>
                </div>
                <div>
                  <span className="text-slate-500">α:</span>
                  <p className="font-medium text-slate-900">{structure.lattice.alpha.toFixed(1)}°</p>
                </div>
                <div>
                  <span className="text-slate-500">β:</span>
                  <p className="font-medium text-slate-900">{structure.lattice.beta.toFixed(1)}°</p>
                </div>
                <div>
                  <span className="text-slate-500">γ:</span>
                  <p className="font-medium text-slate-900">{structure.lattice.gamma.toFixed(1)}°</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> {/* grid */}
    </div>
  );
};

export default Visualization;
