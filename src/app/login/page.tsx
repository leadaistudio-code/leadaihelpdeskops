"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
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
        
        <div className="p-10 flex justify-center bg-slate-900/40">
          <SignIn routing="hash" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}
