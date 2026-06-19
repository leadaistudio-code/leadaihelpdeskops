"use client";

import { useState } from "react";
import { Server, Database, Globe, Network, Cpu, Shield, Search, Filter, Maximize2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function CMDBPage() {
  const [zoom, setZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const cmdbData = {
    id: "BS-001",
    name: "Payroll Application",
    type: "Business Service",
    status: "Healthy",
    icon: <Globe className="w-6 h-6 text-indigo-400" />,
    children: [
      {
        id: "APP-023",
        name: "Workday Portal",
        type: "Web Application",
        status: "Warning",
        icon: <Network className="w-6 h-6 text-fuchsia-400" />,
        children: [
          {
            id: "SRV-WEB-01",
            name: "Frontend Server 1",
            type: "Linux Server",
            status: "Healthy",
            icon: <Server className="w-6 h-6 text-cyan-400" />,
            children: []
          },
          {
            id: "SRV-WEB-02",
            name: "Frontend Server 2",
            type: "Linux Server",
            status: "Critical",
            icon: <Server className="w-6 h-6 text-cyan-400" />,
            children: []
          }
        ]
      },
      {
        id: "DB-104",
        name: "Core Financial DB",
        type: "Database Cluster",
        status: "Healthy",
        icon: <Database className="w-6 h-6 text-emerald-400" />,
        children: [
          {
            id: "SRV-DB-01",
            name: "Primary DB Node",
            type: "Oracle DB",
            status: "Healthy",
            icon: <Cpu className="w-6 h-6 text-amber-400" />,
            children: []
          },
          {
            id: "SRV-DB-02",
            name: "Failover DB Node",
            type: "Oracle DB",
            status: "Healthy",
            icon: <Cpu className="w-6 h-6 text-amber-400" />,
            children: []
          }
        ]
      }
    ]
  };

  const renderNode = (node: any, level: number = 0) => {
    const isSelected = selectedNode === node.id;
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div 
          onClick={() => setSelectedNode(node.id)}
          className={`relative z-10 w-64 glass-panel border rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
            isSelected ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-indigo-500/10' : 
            node.status === 'Critical' ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)] bg-rose-500/5' :
            node.status === 'Warning' ? 'border-amber-500/50 bg-amber-500/5' :
            'border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-center shadow-inner">
              {node.icon}
            </div>
            {node.status === 'Healthy' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {node.status === 'Warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {node.status === 'Critical' && <div className="flex w-5 h-5 rounded-full bg-rose-500/20 items-center justify-center animate-pulse"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div></div>}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white truncate">{node.name}</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{node.id}</p>
            <div className="mt-2 inline-block px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-bold rounded uppercase tracking-wider border border-white/10">
              {node.type}
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="relative flex justify-center mt-8">
            {/* Vertical line dropping down from parent */}
            <div className="absolute -top-8 left-1/2 w-px h-8 bg-indigo-500/50 -translate-x-1/2"></div>
            
            {/* Horizontal line connecting children */}
            {node.children.length > 1 && (
              <div className="absolute -top-4 left-[25%] right-[25%] h-px bg-indigo-500/50"></div>
            )}
            
            <div className="flex space-x-16 relative pt-4">
              {node.children.map((child: any, index: number) => (
                <div key={child.id} className="relative">
                  {/* Vertical line dropping down to child */}
                  <div className="absolute -top-4 left-1/2 w-px h-4 bg-indigo-500/50 -translate-x-1/2"></div>
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-slate-950/50 backdrop-blur-md z-20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center border border-white/10 shadow-lg">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">CMDB Dependency Map</h1>
              <p className="text-slate-400 mt-1 font-medium">Configuration Management Database Visualizer</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search CIs (e.g., WS-2210)..." className="pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 w-64 transition-colors" />
            </div>
            <button className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-300 transition-colors tooltip-trigger relative group">
              <Filter className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(100)} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-300 transition-colors tooltip-trigger relative group">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[url('/grid-pattern.svg')] bg-center relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="min-w-[1200px] min-h-[800px] p-16 flex items-start justify-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
          {renderNode(cmdbData)}
        </div>
      </div>

      {/* Selected Node Details Panel (if any) */}
      {selectedNode && (
        <div className="absolute bottom-8 left-8 right-8 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between animate-in slide-in-from-bottom-10 z-30">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Server className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Configuration Item Details</h3>
              <p className="text-sm text-slate-400">ID: {selectedNode} • Managed by: System Admin</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors">View Incidents</button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg transition-colors">Propose Change</button>
            <button onClick={() => setSelectedNode(null)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 glass-panel border border-white/10 rounded-full flex items-center p-1 space-x-1 shadow-lg z-20">
        <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 font-bold">-</button>
        <span className="text-xs font-bold text-white px-2">{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 font-bold">+</button>
      </div>
    </div>
  );
}
