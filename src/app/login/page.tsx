"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl overflow-hidden border border-[#e5e5e5] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <div className="p-8 border-b border-[#ededed] text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00d4a4]/12 border border-[#00d4a4]/25 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[#00926f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">LeadAIStudio <span className="text-[#00926f]">AIOps</span></h1>
          <p className="text-[#6b6b6d] text-xs mt-2 font-semibold tracking-wider uppercase">Enterprise Command Center</p>
        </div>

        <div className="p-10 flex justify-center bg-white">
          <SignIn routing="hash" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}
