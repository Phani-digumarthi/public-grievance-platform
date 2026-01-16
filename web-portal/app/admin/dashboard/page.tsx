"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboard, RefreshCcw, MapPin, User, Image as ImageIcon, Clock, CheckCircle, AlertCircle, X, PlayCircle, FileText, Calendar, ArrowLeft, Send, Trash2, Undo2, Filter } from "lucide-react";

// Dynamically import Map (No SSR)
const GrievanceMap = dynamic(() => import("@/components/GrievanceMap"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">Loading Map...</div>
});

interface Grievance {
  _id: string;
  citizenName: string; 
  area: string;        
  category: string;
  description: string;
  status: string;
  priority: string;
  estimatedTime: string;
  imageUrl?: string;
  audioUrl?: string;
  adminReply?: string; 
  createdAt: string;
}

export default function AdminDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [viewFilter, setViewFilter] = useState<'Active' | 'Rejected'>('Active'); // Filter State

  // Resolution State
  const [isResolving, setIsResolving] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  // Undo / Toast State
  const [undoTimer, setUndoTimer] = useState(0);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/grievances", { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setGrievances(json.data);
    } catch (err) {
      console.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  // --- REJECT WITH UNDO LOGIC ---
  const initiateReject = (id: string) => {
    // 1. Close Modal
    setSelectedGrievance(null);
    
    // 2. Set Pending State
    setPendingRejectId(id);
    setUndoTimer(5); // 5 Seconds to Undo

    // 3. Start Countdown for UI (updates every second)
    countdownRef.current = setInterval(() => {
        setUndoTimer((prev) => prev - 1);
    }, 1000);

    // 4. Set Action Timer (Executes after 5 seconds)
    timerRef.current = setTimeout(() => {
        finalizeReject(id);
    }, 5000);
  };

  const handleUndo = () => {
    // Stop everything
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPendingRejectId(null);
    setUndoTimer(0);
  };

  const finalizeReject = async (id: string) => {
    handleUndo(); // Cleanup timers
    try {
        await fetch(`http://localhost:5000/api/grievances/${id}/reject`, { method: 'PATCH' });
        fetchData(); // Refresh list to remove it from Active view
    } catch (err) {
        console.error("Reject failed");
    }
  };

  // --- RESOLVE LOGIC ---
  async function handleResolve() {
    if (!selectedGrievance) return;
    try {
        const res = await fetch(`http://localhost:5000/api/grievances/${selectedGrievance._id}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminReply: adminNote || "Issue resolved by municipal team." })
        });
        if (res.ok) {
            setIsResolving(false);
            setAdminNote("");
            setSelectedGrievance(null); 
            fetchData();
        }
    } catch (err) {
        alert("Error updating status");
    }
  }

  // Filter Data based on selection
  const displayedGrievances = grievances.filter(g => 
    viewFilter === 'Active' ? g.status !== 'Rejected' : g.status === 'Rejected'
  );

  return (
    <div className="min-h-screen bg-slate-100 relative pb-20">
      
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2 font-bold text-lg">
          <LayoutDashboard className="text-blue-400" />
          Kakinada Municipal Admin
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto relative z-0"> 
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Live Grievances</h1>
            <p className="text-slate-600 font-medium mt-1">Real-time issue tracking</p>
          </div>
          <button 
              onClick={fetchData}
              className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 text-slate-800 shadow-sm transition-all"
          >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Pending" value={grievances.filter(g => g.status === 'Pending').length} color="orange" icon={<Clock />} />
            <StatCard title="High Priority" value={grievances.filter(g => g.priority === 'High').length} color="red" icon={<AlertCircle />} />
            <StatCard title="Resolved" value={grievances.filter(g => g.status === 'Resolved').length} color="green" icon={<CheckCircle />} />
        </div>

        {/* --- MAP SECTION --- */}
        <div className="mb-8 relative z-0">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="text-blue-600"/> PGHP Hotspot Map
            </h2>
            <GrievanceMap grievances={displayedGrievances} />
        </div>

        {/* --- TABS FOR FILTERING --- */}
        <div className="flex gap-4 mb-4">
            <button 
                onClick={() => setViewFilter('Active')}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${viewFilter === 'Active' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
                <Filter size={14}/> Active Issues
            </button>
            <button 
                onClick={() => setViewFilter('Rejected')}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${viewFilter === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
                <Trash2 size={14}/> Spam / Rejected
            </button>
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden relative z-0 min-h-[300px]">
            {displayedGrievances.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium">
                    No {viewFilter.toLowerCase()} grievances found.
                </div>
            ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="p-4 text-slate-800 text-xs uppercase font-extrabold tracking-wider">Location / Citizen</th>
                  <th className="p-4 text-slate-800 text-xs uppercase font-extrabold tracking-wider">Issue Preview</th>
                  <th className="p-4 text-slate-800 text-xs uppercase font-extrabold tracking-wider">Category</th>
                  <th className="p-4 text-slate-800 text-xs uppercase font-extrabold tracking-wider">Priority</th>
                  <th className="p-4 text-slate-800 text-xs uppercase font-extrabold tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedGrievances.map((g) => (
                  <tr 
                    key={g._id} 
                    onClick={() => setSelectedGrievance(g)}
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 flex items-center gap-1 text-sm">
                            <MapPin size={14} className="text-red-600" /> {g.area}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                            <User size={12} /> {g.citizenName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center gap-2">
                            {g.audioUrl ? <PlayCircle size={16} className="text-blue-600"/> : <FileText size={16} className="text-slate-400"/>}
                            <p className="text-sm font-medium text-slate-800 max-w-xs truncate" title={g.description}>
                                {g.description}
                            </p>
                        </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${getCategoryColor(g.category)}`}>
                        {g.category}
                      </span>
                    </td>
                    <td className="p-4">
                        <span className={`w-fit px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            g.priority === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                            g.priority === 'Medium' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                            {g.priority}
                        </span>
                    </td>
                    <td className="p-4">
                        <button className="text-blue-600 text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details &rarr;
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
        </div>
      </main>

      {/* --- UNDO TOAST (Bottom Fixed) --- */}
      {pendingRejectId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex flex-col">
                <span className="font-bold text-sm">Marking as Spam...</span>
                <span className="text-xs text-slate-400">Moving to trash in {undoTimer}s</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <button 
                onClick={handleUndo}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors"
            >
                <Undo2 size={18} /> UNDO
            </button>
        </div>
      )}

      {/* --- POP-UP MODAL --- */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedGrievance(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                               Grievance #{selectedGrievance._id.slice(-6)}
                            </h2>
                            <p className="text-slate-400 text-xs">Posted on {new Date(selectedGrievance.createdAt).toDateString()}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGrievance(null)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto flex-1 p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 min-h-full">
                        
                        {/* LEFT: Metadata */}
                        <div className="p-6 bg-slate-50 border-r border-slate-200 space-y-6">
                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Current Status</p>
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(selectedGrievance.status)}`}>
                                    {selectedGrievance.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Citizen</p>
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-slate-600"/> 
                                        <span className="font-bold text-slate-800">{selectedGrievance.citizenName}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Location</p>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-red-500"/> 
                                        <span className="font-medium text-slate-800">{selectedGrievance.area}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Main Content */}
                        <div className="p-8 md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600"/> Description
                                </h3>
                                <div className="p-5 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed shadow-sm text-lg">
                                    {selectedGrievance.description}
                                </div>
                            </div>

                            {selectedGrievance.audioUrl && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                                        <PlayCircle size={16} className="text-purple-600"/> Voice Recording
                                    </h3>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-4">
                                        <audio controls className="w-full h-12 focus:outline-none">
                                            <source src={selectedGrievance.audioUrl} type="audio/wav" />
                                            Your browser does not support audio.
                                        </audio>
                                    </div>
                                </div>
                            )}

                            {selectedGrievance.imageUrl && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                                        <ImageIcon size={16} className="text-green-600"/> Photo Evidence
                                    </h3>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                                        <img 
                                            src={selectedGrievance.imageUrl} 
                                            alt="Evidence" 
                                            className="w-full h-auto object-contain max-h-[400px]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    {selectedGrievance.status === 'Pending' || selectedGrievance.status === 'In Progress' ? (
                        !isResolving ? (
                            <>
                                <button 
                                    onClick={() => initiateReject(selectedGrievance._id)}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-300 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={18}/> Mark as Spam
                                </button>
                                <button 
                                    onClick={() => setIsResolving(true)}
                                    className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-200 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={18}/> Resolve Issue
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 w-full animate-in slide-in-from-right-10">
                                <input 
                                    type="text" 
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Enter resolution details..."
                                    className="flex-1 p-3 border border-slate-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                                />
                                <button 
                                    onClick={() => setIsResolving(false)}
                                    className="px-4 py-3 font-bold text-slate-500 hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleResolve}
                                    className="px-6 py-3 rounded-xl font-bold text-white bg-green-700 hover:bg-green-800 shadow-lg flex items-center gap-2"
                                >
                                    <Send size={18}/> Confirm
                                </button>
                            </div>
                        )
                    ) : (
                       <div className="w-full text-center p-2 font-bold text-slate-500 bg-slate-100 rounded-lg">
                           This issue is {selectedGrievance.status}
                       </div>
                    )}
                </div>

            </div>
        </div>
      )}
    </div>
  );
}

// Helpers
interface StatCardProps { title: string; value: number; color: "orange" | "red" | "green"; icon: React.ReactNode; }
function StatCard({ title, value, color, icon }: StatCardProps) {
    const colors: Record<string, string> = {
        orange: "bg-orange-50 text-orange-800 border-orange-200",
        red: "bg-red-50 text-red-800 border-red-200",
        green: "bg-green-50 text-green-800 border-green-200",
    };
    return (
        <div className={`p-6 rounded-xl border ${colors[color]} flex items-center justify-between shadow-sm`}>
            <div>
                <p className="text-sm font-bold opacity-80 uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-extrabold mt-1">{value}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-60 rounded-lg">{icon}</div>
        </div>
    );
}

function getCategoryColor(category: string) {
    switch (category) {
        case 'Police': return 'bg-red-100 text-red-800';
        case 'Water': return 'bg-blue-100 text-blue-800';
        case 'Electricity': return 'bg-yellow-100 text-yellow-800';
        case 'Roads': return 'bg-orange-100 text-orange-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Resolved': return 'bg-green-100 text-green-800';
        case 'Pending': return 'bg-orange-100 text-orange-800';
        case 'Rejected': return 'bg-red-100 text-red-800'; // Added Rejected Color
        default: return 'bg-slate-100 text-slate-600';
    }
}