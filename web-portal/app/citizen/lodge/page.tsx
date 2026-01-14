"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Loader2, Send, CheckCircle2, Image as ImageIcon, X, Mic, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LodgeGrievance() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 1. Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await handleVoiceSubmit(audioBlob);
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow permissions.");
    }
  };

  // 2. Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 3. Send Audio to Backend
  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      // 'audio' matches upload.single('audio') in Express
      formData.append("audio", audioBlob, "voice_complaint.wav"); 

      const res = await fetch("http://localhost:5000/api/grievances/audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Audio Processing Failed");
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      alert("Voice Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Text/Image Submit (Existing Logic)
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("description", description);
      if (file) {
        formData.append("image", file);
      }

      const res = await fetch("http://localhost:5000/api/grievances", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server Error");
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      alert("Submission Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        <div className="bg-blue-700 p-6 text-white flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-blue-600 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">New Grievance</h1>
            <p className="text-blue-100 text-sm">Type, Upload, or Speak.</p>
          </div>
        </div>

        <div className="p-8">
            {/* VOICE RECORDER SECTION */}
            <div className="mb-8 p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <p className="text-slate-600 font-medium mb-4">Quick Complaint? Use Voice</p>
                
                {!isRecording ? (
                    <button 
                        onClick={startRecording}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-200"
                    >
                        <Mic size={20} /> Tap to Speak
                    </button>
                ) : (
                    <button 
                        onClick={stopRecording}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold animate-pulse transition-all shadow-lg hover:shadow-red-200"
                    >
                        <Square size={20} fill="currentColor" /> Stop & Submit
                    </button>
                )}
                {isRecording && <p className="text-red-500 text-xs mt-2 font-mono">Recording... Tap stop to send.</p>}
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR TYPE DETAILS</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

          {/* TEXT FORM SECTION */}
          <form onSubmit={handleTextSubmit} className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700"
                placeholder="Describe the issue here..."
                // Not required if they used voice, but required for text submit
                required={!result} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photo Evidence
              </label>
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500">Upload Image</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <span className="text-sm text-blue-700 truncate max-w-[200px]">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !description}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              {loading ? "Processing..." : "Submit Text Report"}
            </button>
          </form>

          {/* Result Display */}
          {result && result.data && (
            <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full text-green-700">
                  <CheckCircle2 size={24} />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-green-900 text-lg">Report Submitted!</h3>
                  <p className="text-sm text-green-700 mb-3">AI Analysis Complete</p>
                  
                  {/* Show Transcribed Text if it was voice */}
                  <div className="bg-white p-3 rounded-lg border border-green-100 mb-3">
                     <p className="text-xs text-slate-500 uppercase font-bold">What we heard/read:</p>
                     <p className="text-slate-700 italic">"{result.data.description}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-slate-500 uppercase font-bold">Category</p>
                        <p className="text-green-800 font-medium">{result.data.category}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-slate-500 uppercase font-bold">Priority</p>
                        <p className={`font-medium ${result.data.priority === 'High' ? 'text-red-600' : 'text-green-800'}`}>
                            {result.data.priority}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}