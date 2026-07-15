"use client";

import { useState, useEffect } from "react";
import { QrCode, MonitorSmartphone, BadgeAlert, Laptop, Smartphone, Headphones, HelpCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createWalkupTicket, getWalkupQueue } from "@/app/actions/walkupActions";

export default function WalkUpExperience() {
  const [step, setStep] = useState(1);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ number: string; queue: number; etaMins: number } | null>(null);
  const [liveQueue, setLiveQueue] = useState<{ queue: number; etaMins: number }>({ queue: 0, etaMins: 4 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keep the queue indicator fresh from real open walk-up tickets.
  useEffect(() => {
    getWalkupQueue().then(setLiveQueue).catch(() => {});
    const t = setInterval(() => getWalkupQueue().then(setLiveQueue).catch(() => {}), 15_000);
    return () => clearInterval(t);
  }, []);

  const issueTypes = [
    { id: "laptop", name: "Laptop / PC Issue", icon: <Laptop className="w-12 h-12 mb-4" /> },
    { id: "mobile", name: "Mobile Device", icon: <Smartphone className="w-12 h-12 mb-4" /> },
    { id: "peripherals", name: "Headphones / Mouse", icon: <Headphones className="w-12 h-12 mb-4" /> },
    { id: "access", name: "Account Access", icon: <BadgeAlert className="w-12 h-12 mb-4" /> },
    { id: "other", name: "Something Else", icon: <HelpCircle className="w-12 h-12 mb-4" /> },
  ];

  const handleIssueSelect = async (id: string) => {
    setSelectedIssue(id);
    setStep(3);

    // Open a real ticket for this walk-up.
    try {
      const t = await createWalkupTicket(id);
      setTicket(t);
    } catch {
      setTicket(null);
    }

    // Auto reset to the welcome screen after a short confirmation.
    setTimeout(() => {
      setStep(1);
      setSelectedIssue(null);
      setTicket(null);
    }, 8000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f7f7f7] flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Kiosk light ground */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[#f7f7f7]"></div>

      {/* Top Bar */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00d4a4]/10 flex items-center justify-center ">
            <MonitorSmartphone className="w-6 h-6 text-[#00926f]" />
          </div>
          <span className="text-2xl font-bold text-[#0a0a0a] tracking-tight">TechLounge Kiosk</span>
        </div>
        <div className="text-3xl font-bold text-[#0a0a0a]">{currentTime}</div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center justify-center">
        
        {step === 1 && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-6xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6">Welcome to TechLounge</h1>
            <p className="text-2xl text-[#5a5a5c] mb-16 font-medium">Please scan your employee badge or tap below to check in.</p>

            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="w-64 h-64 border-2 border-[#00d4a4] rounded-2xl flex flex-col items-center justify-center bg-white shadow-[0_8px_24px_rgba(0,212,164,0.08)] cursor-pointer" onClick={() => setStep(2)}>
                <QrCode className="w-24 h-24 text-[#00926f] mb-4" />
                <span className="text-xl font-bold text-[#0a0a0a] uppercase tracking-wider">Tap to Scan</span>
              </div>
            </div>

            <Link href="/" className="absolute bottom-8 right-8 px-6 py-3 bg-white border border-[#e5e5e5] hover:bg-[#f7f7f7] rounded-full text-[#0a0a0a] font-bold transition-colors">
              Exit Kiosk Mode
            </Link>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="flex items-center space-x-4 mb-12 justify-center">
              <div className="w-16 h-16 rounded-full bg-[#00d4a4]/10 border border-[#00d4a4]/20 flex items-center justify-center text-[#00926f] text-2xl font-bold">PS</div>
              <div className="text-left">
                <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#0a0a0a]">Hi, Priya Sharma!</h2>
                <p className="text-xl text-[#6b6b6d]">What do you need help with today?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {issueTypes.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue.id)}
                  className="bg-white border border-[#e5e5e5] hover:border-[#00d4a4] hover:bg-[#f7f7f7] rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="text-[#5a5a5c] group-hover:text-[#00926f] transition-colors">
                    {issue.icon}
                  </div>
                  <span className="text-lg font-bold text-[#3a3a3c] group-hover:text-[#0a0a0a]">{issue.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-in zoom-in-95 fade-in duration-500">
            <div className="w-32 h-32 bg-[#00d4a4]/15 rounded-full flex items-center justify-center mx-auto mb-8 ">
              <CheckCircle2 className="w-16 h-16 text-[#00926f]" />
            </div>
            <h1 className="text-6xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6">You&apos;re checked in!</h1>
            <p className="text-2xl text-[#5a5a5c] mb-4 font-medium">Please take a seat in the lounge.</p>
            <div className="flex items-center justify-center gap-4 mt-8">
              {ticket && (
                <div className="inline-block px-8 py-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                  <p className="text-[#6b6b6d] uppercase tracking-wider text-sm font-bold mb-2">Your Ticket</p>
                  <p className="text-4xl font-bold text-[#00926f]">{ticket.number}</p>
                </div>
              )}
              <div className="inline-block px-8 py-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                <p className="text-[#6b6b6d] uppercase tracking-wider text-sm font-bold mb-2">Estimated Wait</p>
                <p className="text-4xl font-bold text-[#0a0a0a]">~{ticket?.etaMins ?? liveQueue.etaMins} mins</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Queue Display */}
      {step === 1 && (
        <div className="absolute bottom-0 w-full bg-white/90 border-t border-[#e5e5e5] p-6 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-[#00d4a4] rounded-full"></div>
                <span className="text-[#00926f] font-bold uppercase tracking-wider text-sm">TechLounge is Open</span>
              </div>
              <div className="h-6 w-px bg-[#e5e5e5]"></div>
              <div className="text-[#5a5a5c] font-medium">Current Queue: <span className="font-bold text-[#0a0a0a] ml-2">{liveQueue.queue} {liveQueue.queue === 1 ? "Person" : "People"}</span></div>
              <div className="text-[#5a5a5c] font-medium">Est. Wait: <span className="font-bold text-[#0a0a0a] ml-2">{liveQueue.etaMins} Mins</span></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#e5e5e5] flex items-center justify-center text-xs font-bold text-[#3a3a3c]">JS</div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#00d4a4] flex items-center justify-center text-xs font-bold text-[#0a0a0a]">MK</div>
              </div>
              <span className="text-[#6b6b6d] text-sm font-bold">Serving Now</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
