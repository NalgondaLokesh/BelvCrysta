// import React, { useState } from 'react';
// import {
//   Search,
//   Filter,
//   Download,
//   Eye,
//   Calendar,
//   Atom,
//   Star,
//   MoreVertical,
//   AlertCircle 
// } from 'lucide-react';


// interface HistoryItem {
//   id: string;
//   timestamp: string;
//   parameters: {
//     bandGap?: string;
//     symmetry?: string;
//     magnetism?: string;
//   };
//   resultsCount: number;
//   status: 'completed' | 'failed' | 'running';
//   favorite: boolean;
// }

// const History: React.FC = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   const mockHistory: HistoryItem[] = [
//     {
//       id: '1',
//       timestamp: '2025-01-08T10:30:00Z',
//       parameters: {
//         bandGap: '2.0-3.0 eV',
//         symmetry: 'Cubic',
//         magnetism: 'Ferromagnetic'
//       },
//       resultsCount: 15,
//       status: 'completed',
//       favorite: true
//     },
//     {
//       id: '2',
//       timestamp: '2025-01-08T09:15:00Z',
//       parameters: {
//         bandGap: '1.5 eV',
//         symmetry: 'Tetragonal',
//         magnetism: 'Diamagnetic'
//       },
//       resultsCount: 8,
//       status: 'completed',
//       favorite: false
//     },
//     {
//       id: '3',
//       timestamp: '2025-01-07T16:45:00Z',
//       parameters: {
//         bandGap: '3.5-4.0 eV',
//         symmetry: 'Hexagonal',
//         magnetism: 'Paramagnetic'
//       },
//       resultsCount: 12,
//       status: 'completed',
//       favorite: false
//     },
//     {
//       id: '4',
//       timestamp: '2025-01-07T14:20:00Z',
//       parameters: {
//         bandGap: '0.5 eV',
//         symmetry: 'Monoclinic'
//       },
//       resultsCount: 0,
//       status: 'failed',
//       favorite: false
//     }
//   ];

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'completed':
//         return <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>;
//       case 'failed':
//         return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
//       case 'running':
//         return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>;
//       default:
//         return <div className="w-2 h-2 bg-slate-300 rounded-full"></div>;
//     }
//   };

//   const formatDate = (timestamp: string) => {
//     return new Date(timestamp).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const filteredHistory = mockHistory.filter(item => {
//     const matchesSearch = JSON.stringify(item.parameters).toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="text-center space-y-4">
//         <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
//           Generation History
//         </h1>
//         <p className="text-lg text-slate-600 max-w-2xl mx-auto">
//           Review your past crystal generation sessions and download results.
//         </p>
//       </div>

//       {/* Search and Filter */}
//       <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
//         <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//             <input
//               type="text"
//               placeholder="Search by parameters..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <Filter className="w-4 h-4 text-slate-400" />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//             >
//               <option value="all">All Status</option>
//               <option value="completed">Completed</option>
//               <option value="failed">Failed</option>
//               <option value="running">Running</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* History List */}
//       <div className="space-y-4">
//         {filteredHistory.map((item) => (
//           <div
//             key={item.id}
//             className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
//           >
//             <div className="flex items-start justify-between">
//               <div className="flex-1 space-y-3">
//                 <div className="flex items-center space-x-3">
//                   {getStatusIcon(item.status)}
//                   <div className="flex items-center space-x-2 text-sm text-slate-500">
//                     <Calendar className="w-4 h-4" />
//                     <span>{formatDate(item.timestamp)}</span>
//                   </div>
//                   {item.favorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
//                 </div>

//                 <div className="grid md:grid-cols-3 gap-4">
//                   {Object.entries(item.parameters).map(([key, value]) => (
//                     <div key={key} className="space-y-1">
//                       <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
//                         {key.replace(/([A-Z])/g, ' $1').trim()}
//                       </span>
//                       <p className="text-sm font-medium text-slate-900">{value || 'Any'}</p>
//                     </div>
//                   ))}
//                 </div>

//                 {item.status === 'completed' && (
//                   <div className="flex items-center space-x-4 text-sm">
//                     <div className="flex items-center space-x-2 text-emerald-600">
//                       <Atom className="w-4 h-4" />
//                       <span>{item.resultsCount} structures generated</span>
//                     </div>
//                   </div>
//                 )}

//                 {item.status === 'failed' && (
//                   <div className="flex items-center space-x-2 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     <span>Generation failed - check parameters</span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex items-center space-x-2 ml-4">
//                 {item.status === 'completed' && (
//                   <>
//                     <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
//                       <Eye className="w-4 h-4" />
//                     </button>
//                     <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
//                       <Download className="w-4 h-4" />
//                     </button>
//                   </>
//                 )}
//                 <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
//                   <MoreVertical className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {filteredHistory.length === 0 && (
//         <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
//           <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
//             <Search className="w-8 h-8 text-slate-400" />
//           </div>
//           <h3 className="text-lg font-semibold text-slate-600 mb-2">
//             No Results Found
//           </h3>
//           <p className="text-slate-500">
//             Try adjusting your search terms or filters.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default History;

// import React, { useEffect, useState } from "react";
// import { Eye, Download, AlertCircle } from "lucide-react";

// interface ModelHistory {
//   _id: string;
//   formula: string;
//   spacegroup: number;
//   lattice_parameters: {
//     a: number;
//     b: number;
//     c: number;
//     alpha: number;
//     beta: number;
//     gamma: number;
//     volume: number;
//   };
//   atoms: Array<{
//     element: string;
//     frac_coords: [number, number, number];
//   }>;
//   xyz_data: string;
//   cif_data: string;
//   created_at: string;
// }

// const History: React.FC = () => {
//   const [history, setHistory] = useState<ModelHistory[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const API_URL = API_ENDPOINTS.HISTORY.substring(0, API_ENDPOINTS.HISTORY.lastIndexOf('/'));

//   useEffect(() => {
//     const fetchHistory = async () => {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         setError("Please log in to view your history");
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log("📡 Fetching history from backend...");

//         const response = await fetch(`${API_URL}/history?token=${token}`, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//           },
//         });

//         console.log("🧾 Response status:", response.status);

//         if (!response.ok) {
//           const errorText = await response.text();
//           console.error("❌ Server returned error:", errorText);
//           throw new Error(`Failed to fetch history: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("✅ Received data from backend:", data);

//         if (Array.isArray(data.history) && data.history.length > 0) {

//           setHistory(data.history);
//         } else {
//           setError(data.error || "No history found");
//         }
//       } catch (err: any) {
//         console.error("❌ Fetch failed:", err);
//         setError(err.message || "Failed to fetch history");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchHistory();
//   }, []);

//   const handleDownload = (type: "xyz" | "cif", data: string, formula: string) => {
//     const extension = type === "xyz" ? "xyz" : "cif";
//     const blob = new Blob([data], { type: "text/plain" });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${formula}.${extension}`;
//     document.body.appendChild(a);
//     a.click();
//     window.URL.revokeObjectURL(url);
//     document.body.removeChild(a);
//   };

//   const handleVisualize = (id: string) => {
//     window.location.href = `/visualization/${id}`;
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen text-center">
//         <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
//         <p className="text-red-600 text-lg">{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h1 className="text-3xl font-bold text-indigo-600 mb-6">Your Generated Structures</h1>

//       {history.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-xl">
//           <p className="text-gray-600">You haven’t generated any structures yet.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//           {history.map((item) => (
//             <div
//               key={item._id}
//               className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <div>
//                   <h3 className="font-semibold text-xl text-indigo-800">
//                     {item.formula || "Unknown Formula"}
//                   </h3>
//                   <p className="text-sm text-gray-500 mt-1">
//                     {item.created_at
//                       ? new Date(item.created_at).toLocaleString()
//                       : "Unknown date"}
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-2 mb-4 text-sm text-gray-700">
//                 <p>
//                   <span className="font-medium text-gray-600">Space Group:</span>{" "}
//                   {item.spacegroup}
//                 </p>
//                 <p>
//                   <span className="font-medium text-gray-600">Volume:</span>{" "}
//                   {item.lattice_parameters?.volume?.toFixed(2)} Å³
//                 </p>
//                 <p>
//                   <span className="font-medium text-gray-600">Atoms:</span>{" "}
//                   {item.atoms?.length}
//                 </p>
//               </div>

//               <div className="flex justify-end space-x-2 mt-4">
//                 <button
//                   onClick={() => handleDownload("xyz", item.xyz_data, item.formula)}
//                   className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                   title="Download XYZ"
//                 >
//                   <Download className="w-5 h-5" />
//                 </button>

//                 <button
//                   onClick={() => handleVisualize(item._id)}
//                   className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
//                   title="Visualize Structure"
//                 >
//                   <Eye className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default History;

import React, { useEffect, useState, useRef } from "react";
import { Eye, Download, AlertCircle, X } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

interface ModelHistory {
  _id: string;
  formula: string;
  spacegroup: number;
  lattice_parameters: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
    volume: number;
  };
  atoms: Array<{
    element: string;
    frac_coords: [number, number, number];
  }>;
  xyz_data: string;
  cif_data: string;
  created_at: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<ModelHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStructure, setSelectedStructure] = useState<ModelHistory | null>(null);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const API_URL = API_ENDPOINTS.HISTORY.substring(0, API_ENDPOINTS.HISTORY.lastIndexOf('/'));

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

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view your history");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_ENDPOINTS.HISTORY}?token=${token}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data.history)) {
          setHistory(data.history);
        } else {
          setError("No history found");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownload = (type: "xyz" | "cif", data: string, formula: string) => {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formula}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVisualize = (structure: ModelHistory) => {
    setSelectedStructure(structure);
    setTimeout(() => {
      if (viewerRef.current && structure.xyz_data && viewerLoaded && (window as any).$3Dmol) {
        viewerRef.current.innerHTML = "";
        const viewer = (window as any).$3Dmol.createViewer(viewerRef.current, { backgroundColor: "white" });
        viewer.addModel(structure.xyz_data, "xyz");
        viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });
        viewer.zoomTo();
        viewer.render();
      }
    }, 100);
  };

  const closeModal = () => {
    setSelectedStructure(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-neon-pink mb-6">Your Generated Structures</h1>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-xl border border-neon-purple/20">
          <p className="text-gray-400">You haven't generated any structures yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {history.map((item) => (
            <div
              key={item._id}
              className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-neon-purple/20 hover:border-neon-cyan/40 transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-neon-cyan">
                    {item.formula || "Unknown Formula"}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown date"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-300">
                <p>
                  <span className="font-medium text-gray-400">Space Group:</span> {item.spacegroup}
                </p>
                
                <p>
                  <span className="font-medium text-gray-400">Atoms:</span> {item.atoms?.length}
                </p>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => handleDownload("xyz", item.xyz_data, item.formula)}
                  className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-colors"
                  title="Download XYZ"
                >
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleVisualize(item)}
                  className="p-2 text-gray-400 hover:text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-colors"
                  title="Visualize Structure"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visualization Modal */}
      {selectedStructure && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative border border-neon-purple/30">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-neon-pink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-neon-cyan mb-4">
              {selectedStructure.formula} — Visualization
            </h2>
            <div
              ref={viewerRef}
              className="w-full h-[500px] rounded-lg border border-neon-purple/30 bg-black/50"
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
