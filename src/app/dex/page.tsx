"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Radio, Cpu, Power, Trash2, CheckCircle2, ShieldCheck, Zap, History, BrainCircuit, AlertTriangle } from "lucide-react";

export default function DEXDashboard() {
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [autoActionsTaken, setAutoActionsTaken] = useState(0);
  const [remediationLogs, setRemediationLogs] = useState<{time: string, message: string}[]>([
    { time: '10:45 AM', message: 'Auto-Pilot enabled. System monitoring active.' }
  ]);

  const [endpoints, setEndpoints] = useState([
    { id: 'WS-1042', user: 'Jane Doe', cpu: '92%', mem: '14GB/16GB', status: 'Critical', latency: '120ms' },
    { id: 'WS-8831', user: 'John Smith', cpu: '12%', mem: '4GB/16GB', status: 'Healthy', latency: '45ms' },
    { id: 'WS-9920', user: 'System Admin', cpu: '45%', mem: '8GB/32GB', status: 'Healthy', latency: '30ms' },
    { id: 'WS-2210', user: 'Alice Chen', cpu: '78%', mem: '15GB/16GB', status: 'Warning', latency: '65ms' },
  ]);

  const [toast, setToast] = useState<{message: string, show: boolean}>({ message: "", show: false });
  const [isRemediating, setIsRemediating] = useState<Record<string, boolean>>({});

  const latencyData = [
    { time: '08:00', ms: 45 },
    { time: '09:00', ms: 52 },
    { time: '10:00', ms: 48 },
    { time: '11:00', ms: 61 },
    { time: '12:00', ms: 120 },
    { time: '13:00', ms: 55 },
    { time: '14:00', ms: 49 },
  ];

  const deviceHealthData = [
    { name: 'Healthy', value: 850 + autoActionsTaken, fill: '#10b981' },
    { name: 'Warning', value: Math.max(0, 120 - Math.floor(autoActionsTaken/2)), fill: '#f59e0b' },
    { name: 'Critical', value: Math.max(0, 30 - Math.ceil(autoActionsTaken/2)), fill: '#ef4444' },
  ];

  const handleRemediation = (id: string, action: string, isAuto: boolean = false) => {
    if (isRemediating[id]) return;
    
    setIsRemediating(prev => ({ ...prev, [id]: true }));
    setToast({ message: `${isAuto ? '[AUTO] ' : ''}Executing '${action}' on ${id}...`, show: true });
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRemediationLogs(prev => [{ time: timeString, message: `${isAuto ? '⚡ Auto-Triggered' : '👤 Manual'}: ${action} on ${id}` }, ...prev]);

    setTimeout(() => {
      setToast({ message: `Successfully executed '${action}' on ${id}. Endpoint stabilizing.`, show: true });
      if (isAuto) {
        setAutoActionsTaken(prev => prev + 1);
      }
      
      setEndpoints(prev => prev.map(ep => {
        if (ep.id === id) {
          return { ...ep, cpu: '15%', mem: '6GB/16GB', status: 'Healthy', latency: '40ms' };
        }
        return ep;
      }));
      
      setIsRemediating(prev => ({ ...prev, [id]: false }));

      setTimeout(() => {
        setToast({ message: "", show: false });
      }, 4000);
    }, 2000);
  };

  // Auto-pilot effect
  useEffect(() => {
    if (!isAutoPilotOn) return;

    const interval = setInterval(() => {
      const issueEndpoint = endpoints.find(ep => ep.status === 'Critical' || ep.status === 'Warning');
      if (issueEndpoint && !isRemediating[issueEndpoint.id]) {
        const action = issueEndpoint.status === 'Critical' ? 'Remote Reboot' : 'Clear Cache';
        handleRemediation(issueEndpoint.id, action, true);
      } else if (!issueEndpoint && endpoints.length < 6) {
        // Occasionally spawn a new issue to show auto-pilot working continuously
        if (Math.random() > 0.7) {
          const newId = `WS-${Math.floor(Math.random() * 9000) + 1000}`;
          setEndpoints(prev => [
            ...prev,
            { id: newId, user: 'Auto Generated', cpu: '95%', mem: '15GB/16GB', status: 'Critical', latency: '200ms' }
          ]);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPilotOn, endpoints, isRemediating]);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[9999] glass-panel border border-emerald-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 mt-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">DEX Auto-Remediation</h1>
            <p className="text-slate-400 mt-1">Real-time observability and remote action execution.</p>
          </div>
        </div>

        <div className={`glass-panel border px-5 py-3 rounded-2xl flex items-center space-x-4 transition-all duration-300 ${isAutoPilotOn ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500/5' : 'border-white/10'}`}>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white flex items-center space-x-2">
              <Zap className={`w-4 h-4 ${isAutoPilotOn ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Proactive Auto-Pilot</span>
            </span>
            <span className="text-xs text-slate-400">{isAutoPilotOn ? 'Monitoring and healing automatically' : 'Manual remediation required'}</span>
          </div>
          <button 
            onClick={() => setIsAutoPilotOn(!isAutoPilotOn)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isAutoPilotOn ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAutoPilotOn ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* AIOps Predictive Intelligence Panel */}
      <div className="mb-6 glass-panel border border-indigo-500/30 bg-indigo-500/5 rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <BrainCircuit className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="flex items-start space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-extrabold text-white flex items-center space-x-3">
              <span>Predictive Intelligence (AIOps)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider animate-pulse">Scanning</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Analyzing historical telemetry to predict hardware failures before they occur.</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-start space-x-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Memory Leak Detected: WS-8831</div>
                  <div className="text-xs text-slate-400 mt-1">Based on current trajectory, system memory will exhaust in <span className="text-amber-400 font-bold">~4.2 hours</span>. Recommend scheduling background restart.</div>
                  <button className="mt-3 text-xs font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">Queue Restart</button>
                </div>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-start space-x-4">
                <Cpu className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Thermal Degradation: WS-2210</div>
                  <div className="text-xs text-slate-400 mt-1">CPU thermal paste likely degraded. Temperature averaging 15% higher than fleet baseline. <span className="text-rose-400 font-bold">78% probability of failure</span> in 30 days.</div>
                  <button className="mt-3 text-xs font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">Create Hardware Ticket</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel rounded-3xl p-8 lg:col-span-2 flex flex-col border border-white/10">
          <div className="flex items-center space-x-2 mb-6">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Global Network Latency (ms)</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="ms" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 flex flex-col border border-white/10 relative overflow-hidden group">
          {isAutoPilotOn && (
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-32 h-32 text-emerald-500" />
            </div>
          )}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Fleet Health</h2>
            </div>
            {isAutoPilotOn && <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/30 animate-pulse">Auto-Healing Active</span>}
          </div>
          <div className="flex-1 min-h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceHealthData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.8)" fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400 font-medium">Auto-Remediations Today</span>
               <span className="font-black text-emerald-400 text-lg">{autoActionsTaken}</span>
             </div>
             <div className="flex justify-between items-center text-xs mt-1">
               <span className="text-slate-500">Estimated Admin Time Saved</span>
               <span className="font-bold text-slate-300">{(autoActionsTaken * 15).toFixed(0)} mins</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-panel rounded-3xl overflow-visible border border-white/10">
          <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 rounded-t-3xl">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Active Anomalies & Remediation</h2>
          </div>
          <div className="overflow-visible">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4 font-bold">Endpoint ID</th>
                  <th className="px-8 py-4 font-bold">Primary User</th>
                  <th className="px-8 py-4 font-bold">CPU Load</th>
                  <th className="px-8 py-4 font-bold">Memory</th>
                  <th className="px-8 py-4 font-bold">Status</th>
                  <th className="px-8 py-4 font-bold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {endpoints.map((ep, idx) => (
                  <tr key={idx} className={`hover:bg-white/5 transition-colors ${isRemediating[ep.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="px-8 py-5 font-bold text-cyan-400">{ep.id}</td>
                    <td className="px-8 py-5 text-slate-200">{ep.user}</td>
                    <td className="px-8 py-5 font-mono">{ep.cpu}</td>
                    <td className="px-8 py-5 font-mono">{ep.mem}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        ep.status === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        ep.status === 'Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isRemediating[ep.id] ? 'Fixing...' : ep.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 flex justify-end space-x-2">
                      <button 
                        onClick={() => handleRemediation(ep.id, "Clear Cache")}
                        disabled={ep.status === 'Healthy' || isRemediating[ep.id] || isAutoPilotOn}
                        className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 disabled:opacity-30 transition-colors tooltip-trigger relative group"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Clear Cache</span>
                      </button>
                      <button 
                        onClick={() => handleRemediation(ep.id, "Remote Reboot")}
                        disabled={ep.status === 'Healthy' || isRemediating[ep.id] || isAutoPilotOn}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-30 transition-colors tooltip-trigger relative group"
                      >
                        <Power className="w-4 h-4" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Remote Reboot</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 flex flex-col overflow-hidden">
          <div className="px-6 py-6 border-b border-white/5 bg-slate-900/50 flex items-center space-x-3">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Remediation History</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar max-h-[400px]">
            <div className="space-y-3">
              {remediationLogs.map((log, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/5 animate-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-slate-500 mt-0.5 w-16 shrink-0">{log.time}</div>
                  <div className={`text-sm font-medium ${log.message.includes('Auto-Triggered') ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
