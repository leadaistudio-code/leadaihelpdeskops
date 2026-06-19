"use client";

import { useState, useEffect } from "react";
import { QrCode, MonitorSmartphone, BadgeAlert, Laptop, Smartphone, Headphones, HelpCircle, ArrowRight, User } from "lucide-react";
import Link from "next/link";

export default function WalkUpExperience() {
  const [step, setStep] = useState(1);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const issueTypes = [
    { id: "laptop", name: "Laptop / PC Issue", icon: <Laptop className="w-12 h-12 mb-4" /> },
    { id: "mobile", name: "Mobile Device", icon: <Smartphone className="w-12 h-12 mb-4" /> },
    { id: "peripherals", name: "Headphones / Mouse", icon: <Headphones className="w-12 h-12 mb-4" /> },
    { id: "access", name: "Account Access", icon: <BadgeAlert className="w-12 h-12 mb-4" /> },
    { id: "other", name: "Something Else", icon: <HelpCircle className="w-12 h-12 mb-4" /> },
  ];

  const handleIssueSelect = (id: string) => {
    setSelectedIssue(id);
    setStep(3);
    
    // Auto reset after 5 seconds to simulate finishing
    setTimeout(() => {
      setStep(1);
      setSelectedIssue(null);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Kiosk Background Image simulation */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-slate-950"></div>
      
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <MonitorSmartphone className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">TechLounge Kiosk</span>
        </div>
        <div className="text-3xl font-black text-white">{currentTime}</div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center justify-center">
        
        {step === 1 && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-6xl font-black text-white mb-6">Welcome to TechLounge</h1>
            <p className="text-2xl text-slate-300 mb-16 font-medium">Please scan your employee badge or tap below to check in.</p>
            
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="w-64 h-64 border-4 border-indigo-500/50 rounded-3xl flex flex-col items-center justify-center bg-indigo-500/10 shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-pulse cursor-pointer" onClick={() => setStep(2)}>
                <QrCode className="w-24 h-24 text-indigo-400 mb-4" />
                <span className="text-xl font-bold text-white uppercase tracking-wider">Tap to Scan</span>
              </div>
            </div>
            
            <Link href="/" className="absolute bottom-8 right-8 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold transition-colors">
              Exit Kiosk Mode
            </Link>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="flex items-center space-x-4 mb-12 justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-400 flex items-center justify-center text-white text-2xl font-bold">JD</div>
              <div className="text-left">
                <h2 className="text-3xl font-black text-white">Hi, Jane Doe!</h2>
                <p className="text-xl text-slate-400">What do you need help with today?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {issueTypes.map((issue) => (
                <button 
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue.id)}
                  className="bg-slate-900/80 border border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 group shadow-xl"
                >
                  <div className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                    {issue.icon}
                  </div>
                  <span className="text-lg font-bold text-slate-200 group-hover:text-white">{issue.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-in zoom-in-95 fade-in duration-500">
            <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            </div>
            <h1 className="text-6xl font-black text-white mb-6">You're checked in!</h1>
            <p className="text-2xl text-slate-300 mb-4 font-medium">Please take a seat in the lounge.</p>
            <div className="inline-block px-8 py-4 bg-slate-900 border border-white/10 rounded-2xl mt-8">
              <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-2">Estimated Wait Time</p>
              <p className="text-5xl font-black text-white">~4 mins</p>
            </div>
          </div>
        )}

      </div>

      {/* Footer Queue Display */}
      {step === 1 && (
        <div className="absolute bottom-0 w-full bg-slate-900/90 border-t border-white/10 p-6 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-sm">TechLounge is Open</span>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="text-slate-300 font-medium">Current Queue: <span className="font-black text-white ml-2">2 People</span></div>
              <div className="text-slate-300 font-medium">Est. Wait: <span className="font-black text-white ml-2">4 Mins</span></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">JS</div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">MK</div>
              </div>
              <span className="text-slate-400 text-sm font-bold">Serving Now</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
