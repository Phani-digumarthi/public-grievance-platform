// web-portal/app/citizen/lodge/page.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LodgeGrievance() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null); // Clear previous results

    try {
      // Call our Next.js API (which calls Python)
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-blue-700 p-6 text-white flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-blue-600 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">New Grievance</h1>
            <p className="text-blue-100 text-sm">Describe your issue, our AI will handle the rest.</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Describe your complaint in detail
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-700"
                placeholder="e.g. The street lights in Sector 4 have not been working for 3 days..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !description}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Send size={18} /> Analyze & Submit
                </>
              )}
            </button>
          </form>

          {/* AI Result Display (Fixed Version) */}
          {result && result.data && (
            <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full text-green-700">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-lg">AI Categorization Complete</h3>
                  <div className="mt-2 space-y-1 text-green-800">
                    <p><span className="font-semibold">Department:</span> {result.data.category}</p>
                    <p><span className="font-semibold">Confidence:</span> {(result.data.aiConfidence * 100).toFixed(1)}%</p>
                  </div>
                  <p className="mt-4 text-sm text-green-700">
                    The grievance has been auto-routed to the <strong>{result.data.category}</strong> department dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}