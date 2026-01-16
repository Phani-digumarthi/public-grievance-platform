"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, KeyRound } from "lucide-react";

export default function CitizenLogin() {
  const router = useRouter();
  
  // View States: 'login' | 'signup' | 'forgot'
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form Data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Clear message when switching views
  useEffect(() => { setMessage(""); }, [view]);

  // --- 1. HANDLE LOGIN ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Network Delay
    setTimeout(() => {
        // Retrieve stored users from LocalStorage (Simulated DB)
        const storedUser = localStorage.getItem(`user_${email}`);
        
        if (!storedUser) {
            setLoading(false);
            setMessage("❌ Account not found. Please Sign Up.");
            return;
        }

        const user = JSON.parse(storedUser);
        
        if (user.password !== password) {
            setLoading(false);
            setMessage("❌ Incorrect Password.");
            return;
        }

        // Success: Create Session
        localStorage.setItem("citizen_user", JSON.stringify({ name: user.name, email: user.email }));
        router.push("/citizen/lodge");
    }, 1000);
  };

  // --- 2. HANDLE SIGN UP ---
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
        if (localStorage.getItem(`user_${email}`)) {
            setLoading(false);
            setMessage("⚠️ Email already exists. Please Login.");
            return;
        }

        // Save User
        const newUser = { name, email, password };
        localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
        
        // Auto-login after signup
        localStorage.setItem("citizen_user", JSON.stringify({ name, email }));
        
        setLoading(false);
        router.push("/citizen/lodge");
    }, 1000);
  };

  // --- 3. HANDLE FORGOT PASSWORD ---
  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
        // Check if user exists before sending fake reset
        const storedUser = localStorage.getItem(`user_${email}`);
        if (!storedUser) {
            setMessage("❌ No account found with this email.");
        } else {
            setMessage("✅ Reset link sent to your email!");
        }
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header Section - Blue for Citizens */}
        <div className="bg-blue-700 p-8 text-center text-white">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-bold">
                {view === 'login' && "Citizen Login"}
                {view === 'signup' && "Create Account"}
                {view === 'forgot' && "Reset Password"}
            </h1>
            <p className="text-blue-100 text-sm mt-1">Kakinada Grievance Portal</p>
        </div>

        {/* Body Section */}
        <div className="p-8">
            
            {/* Show Error/Success Messages */}
            {message && (
                <div className={`mb-6 p-3 rounded-lg text-sm font-bold text-center ${message.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {message}
                </div>
            )}

            {/* --- VIEW 1: LOGIN FORM --- */}
            {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="flex justify-end mt-2">
                            <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 hover:underline font-bold uppercase tracking-wide">
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200">
                        {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-slate-600 text-sm font-medium">Don't have an account? <button type="button" onClick={() => setView('signup')} className="text-blue-700 font-bold hover:underline">Create one</button></p>
                    </div>
                </form>
            )}

            {/* --- VIEW 2: SIGN UP FORM --- */}
            {view === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-slate-900 font-medium"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-slate-900 font-medium"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Set Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-slate-900 font-medium"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>
                    </div>

                    <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-200">
                        {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-slate-600 text-sm font-medium">Already have an account? <button type="button" onClick={() => setView('login')} className="text-blue-700 font-bold hover:underline">Log in</button></p>
                    </div>
                </form>
            )}

            {/* --- VIEW 3: FORGOT PASSWORD --- */}
            {view === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-5 animate-in fade-in slide-in-from-left-4">
                     <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-orange-200">
                            <KeyRound size={24} />
                        </div>
                        <p className="text-slate-600 text-sm font-medium">Enter your email and we'll send you a link to reset your password.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-slate-900 font-medium"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <button disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                        {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                    </button>

                    <div className="text-center mt-4">
                        <button type="button" onClick={() => setView('login')} className="text-slate-500 font-bold hover:text-slate-800 text-sm flex items-center justify-center gap-1 mx-auto">
                           <ArrowRight size={14} className="rotate-180"/> Back to Login
                        </button>
                    </div>
                </form>
            )}

        </div>
      </div>
    </div>
  );
}