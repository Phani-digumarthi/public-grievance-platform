"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2, Send, CheckCircle2, Image as ImageIcon, X, Mic, MapPin, User, Trash2, Play, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LodgeGrievance() {
  const router = useRouter();

  // --- States ---
  const [name, setName] = useState("");
  const [area, setArea] = useState("Bhanugudi"); 
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Auto-fill Name from Login
  useEffect(() => {
    const userStr = localStorage.getItem("citizen_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setName(user.name);
    }
  }, []);

  // --- Voice Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob); // Save locally
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    chunksRef.current = [];
  };

  // --- Submit Logic ---
  const handleFinalSubmit = async () => {
    if (!name.trim()) return alert("Please enter your name.");
    if (!description.trim() && !audioBlob) return alert("Please describe the issue OR record voice.");

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("citizenName", name);
      formData.append("area", area);
      if (file) formData.append("image", file);

      let endpoint = "http://localhost:5000/api/grievances"; 

      if (audioBlob) {
        endpoint = "http://localhost:5000/api/grievances/audio";
        formData.append("audio", audioBlob, "voice.wav");
      } else {
        formData.append("description", description);
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      setResult(data);

    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS SCREEN ---
  if (result) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-200 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaint Registered!</h2>
                <p className="text-slate-600 mb-6">Your Grievance ID is <span className="font-mono font-bold text-slate-900">{result.data._id.slice(-6).toUpperCase()}</span></p>
                
                <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 border border-slate-200">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Category</span>
                        <span className="text-sm font-bold text-slate-900">{result.data.category}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Priority</span>
                        <span className={`text-sm font-bold ${result.data.priority === 'High' ? 'text-red-600' : 'text-slate-900'}`}>
                            {result.data.priority}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Est. Time</span>
                        <span className="text-sm font-bold text-blue-700">{result.data.estimatedTime || "1 Week"}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => window.location.reload()} className="flex-1 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors">
                        File Another
                    </button>
                    <Link href="/citizen/history" className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors">
                         View Status <ArrowRight size={16}/>
                    </Link>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      
      {/* Navbar */}
      <div className="bg-slate-900 p-4 text-white sticky top-0 z-10 shadow-lg">
         <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg font-bold">New Grievance</h1>
            </div>
            
            {/* Direct Link to History */}
            <Link href="/citizen/history" className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-700">
                <History size={14} /> My History
            </Link>
         </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* --- BLOCK 1: CITIZEN DETAILS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <User size={16}/> 1. Citizen Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-slate-900 font-medium"
                        placeholder="Enter Name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Area</label>
                    <select 
                        value={area} 
                        onChange={e => setArea(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:border-blue-600 outline-none text-slate-900 font-medium"
                    >
                        <option value="Bhanugudi">Bhanugudi</option>
                        <option value="Sarpavaram">Sarpavaram</option>
                        <option value="Gandhi Nagar">Gandhi Nagar</option>
                        <option value="Main Road">Main Road</option>
                        <option value="Jagannaickpur">Jagannaickpur</option>
                    </select>
                </div>
            </div>
        </div>

        {/* --- BLOCK 2: COMPLAINT DETAILS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Mic size={16}/> 2. Explain Issue
            </h2>
            
            <div className="space-y-4">
                {/* Voice Section */}
                {!audioBlob ? (
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isRecording ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                        {isRecording ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-pulse w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white mb-2">
                                    <Mic size={24} />
                                </div>
                                <p className="text-red-600 font-bold mb-3">Recording...</p>
                                <button onClick={stopRecording} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-red-700">
                                    Stop Recording
                                </button>
                            </div>
                        ) : (
                            <div onClick={startRecording} className="cursor-pointer flex flex-col items-center">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                    <Mic size={24} />
                                </div>
                                <p className="text-slate-900 font-bold">Tap to Record Voice</p>
                                <p className="text-slate-500 text-xs">Best for quick complaints</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <div>
                                <p className="text-green-800 font-bold text-sm">Audio Recorded</p>
                                <p className="text-green-600 text-xs">Ready to submit</p>
                            </div>
                        </div>
                        <button onClick={deleteAudio} className="p-2 text-slate-400 hover:text-red-500">
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">OR TYPE BELOW</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!!audioBlob}
                    className="w-full h-24 p-4 rounded-xl border border-slate-300 focus:border-blue-600 outline-none resize-none text-slate-900 font-medium placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder={audioBlob ? "Audio recorded. Delete audio to type instead." : "Type description here..."}
                />
            </div>
        </div>

        {/* --- BLOCK 3: EVIDENCE --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <ImageIcon size={16}/> 3. Evidence
            </h2>
            {!file ? (
                <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold">Upload Photo</p>
                        <p className="text-slate-500 text-xs">Optional but helpful</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
            ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center">
                            <CheckCircle2 size={20} />
                        </div>
                        <span className="text-blue-900 font-bold text-sm truncate max-w-[150px]">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>

        {/* --- FINAL SUBMIT BUTTON --- */}
        <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {loading ? "Processing..." : "Submit Complaint"}
        </button>

      </div>
    </div>
  );
}