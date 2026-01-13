// web-portal/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Filter, CheckCircle, Clock, AlertCircle } from "lucide-react";

// Define what a Grievance looks like in TypeScript
interface Grievance {
  _id: string;
  category: string;
  description: string;
  status: string;
  aiConfidence: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data when page loads
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:3000/api/grievances", { cache: 'no-store' });
        const json = await res.json();
        if (json.success) {
          setGrievances(json.data);
        }
      } catch (err) {
        console.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-lg">
          <LayoutDashboard className="text-blue-400" />
          Admin Console
        </div>
        <div className="text-sm text-slate-400">Department: Central Oversight</div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Grievance Overview</h1>
            <p className="text-slate-500 mt-1">Real-time monitoring of citizen complaints</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Filter size={16} /> Filter View
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Pending" value={grievances.filter(g => g.status === 'Pending').length} color="orange" icon={<Clock />} />
            <StatCard title="Critical Issues" value={grievances.filter(g => g.category === 'Police').length} color="red" icon={<AlertCircle />} />
            <StatCard title="Resolved" value={grievances.filter(g => g.status === 'Resolved').length} color="green" icon={<CheckCircle />} />
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading dashboard data...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Category</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Issue Description</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">AI Confidence</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grievances.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${getCategoryColor(g.category)}`}>
                        {g.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 max-w-md truncate" title={g.description}>
                      {g.description}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {(g.aiConfidence * 100).toFixed(0)}%
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(g.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {g.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper Components & Functions
function StatCard({ title, value, color, icon }: any) {
    const colors: any = {
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        red: "bg-red-50 text-red-700 border-red-100",
        green: "bg-green-50 text-green-700 border-green-100",
    };
    return (
        <div className={`p-6 rounded-xl border ${colors[color]} flex items-center justify-between`}>
            <div>
                <p className="text-sm font-medium opacity-80">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-40 rounded-lg">{icon}</div>
        </div>
    );
}

function getCategoryColor(category: string) {
    switch (category) {
        case 'Police': return 'bg-red-100 text-red-700';
        case 'Water': return 'bg-blue-100 text-blue-700';
        case 'Electricity': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-slate-100 text-slate-700';
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Resolved': return 'bg-green-100 text-green-700';
        case 'Pending': return 'bg-orange-100 text-orange-700';
        default: return 'bg-slate-100 text-slate-600';
    }
}