"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-aurora flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="bg-slate-900/50 p-8 border-b border-white/5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center neon-border mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">LeadAIStudio <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">AIOps</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-widest uppercase">Enterprise Command Center</p>
        </div>
        
        <div className="p-10">
          <h2 className="text-lg font-bold text-slate-300 mb-8 text-center uppercase tracking-wider">Sign In to Your Account</h2>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-6 font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-slate-200 transition-all placeholder-slate-600"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-slate-200 transition-all placeholder-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all"
            >
              Secure Login
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-sm text-slate-500">
            <p className="font-bold text-slate-400 mb-2 uppercase tracking-wide">Test Accounts:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-1">IT Agent</span>
                <span className="text-xs">agent@ithelpdesk.com</span><br/>
                <span className="text-xs text-slate-600">pw: password123</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">Employee</span>
                <span className="text-xs">jane.doe@company.com</span><br/>
                <span className="text-xs text-slate-600">pw: password123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
