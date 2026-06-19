"use client";

import { useState } from "react";
import { Workflow, Plus, Trash2, ArrowRight, Play, Save, ChevronDown, CheckCircle2, GitCommit, Settings2, Zap, Clock, User, Mail, Database } from "lucide-react";

export default function FlowDesigner() {
  const [nodes, setNodes] = useState([
    { id: 1, type: "trigger", name: "Service Catalog Request Created", desc: "Triggered when 'MacBook Pro' is requested", icon: <Zap className="w-5 h-5 text-amber-400" /> },
    { id: 2, type: "condition", name: "Check Caller Department", desc: "If Department == 'Engineering'", icon: <Settings2 className="w-5 h-5 text-sky-400" /> },
    { id: 3, type: "action", name: "Ask for Manager Approval", desc: "Wait for State = Approved", icon: <User className="w-5 h-5 text-fuchsia-400" /> },
    { id: 4, type: "action", name: "Create Procurement Task", desc: "Assigned to Hardware Group", icon: <Database className="w-5 h-5 text-emerald-400" /> }
  ]);

  const [showNodeSelector, setShowNodeSelector] = useState(false);

  const addNode = (type: string, name: string, icon: any) => {
    setNodes([...nodes, { id: Date.now(), type, name, desc: "Configure this node", icon }]);
    setShowNodeSelector(false);
  };

  const removeNode = (id: number) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col relative z-10 overflow-hidden bg-slate-950">
      
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Workflow className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
              <span>Hardware Provisioning Flow</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">Active</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Automates the approval and fulfillment process for developer hardware.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white font-bold text-sm transition-colors">
            <Play className="w-4 h-4" />
            <span>Test Flow</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm shadow-lg transition-colors">
            <Save className="w-4 h-4" />
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Library Sidebar */}
        <div className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col z-20">
          <div className="p-4 border-b border-white/5 font-bold text-slate-300 text-sm uppercase tracking-widest flex items-center space-x-2">
            <LibraryIcon />
            <span>Action Library</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Triggers</h3>
              <div className="space-y-2">
                <DraggableItem icon={<Zap className="w-4 h-4 text-amber-400" />} title="Record Created" desc="Runs when a record is inserted" />
                <DraggableItem icon={<Clock className="w-4 h-4 text-amber-400" />} title="Scheduled Timer" desc="Runs daily, weekly, or monthly" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Logic</h3>
              <div className="space-y-2">
                <DraggableItem icon={<Settings2 className="w-4 h-4 text-sky-400" />} title="If Condition" desc="Branch based on field values" />
                <DraggableItem icon={<GitCommit className="w-4 h-4 text-sky-400" />} title="For Each" desc="Iterate over a list of records" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Actions</h3>
              <div className="space-y-2">
                <DraggableItem icon={<User className="w-4 h-4 text-fuchsia-400" />} title="Ask for Approval" desc="Generate approval records" />
                <DraggableItem icon={<Database className="w-4 h-4 text-emerald-400" />} title="Create Record" desc="Insert a new task or incident" />
                <DraggableItem icon={<Mail className="w-4 h-4 text-rose-400" />} title="Send Email" desc="Send automated notification" />
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-[url('/grid-pattern.svg')] bg-center overflow-auto custom-scrollbar">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative min-h-full py-16 px-8 flex flex-col items-center">
            
            <div className="space-y-8 flex flex-col items-center w-full max-w-2xl relative">
              {nodes.map((node, idx) => (
                <div key={node.id} className="relative flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                  
                  {/* The Node Card */}
                  <div className={`w-full glass-panel border rounded-2xl p-5 shadow-lg group relative transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] ${
                    node.type === 'trigger' ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50' :
                    node.type === 'condition' ? 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/50' :
                    'border-white/10 bg-slate-900/80 hover:border-white/30'
                  }`}>
                    
                    {/* Step Number Badge */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-slate-300 shadow-md">
                      {idx + 1}
                    </div>

                    <div className="flex items-start justify-between ml-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-inner">
                          {node.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-white">{node.name}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-black/30 px-1.5 py-0.5 rounded">{node.type}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1 font-medium">{node.desc}</p>
                        </div>
                      </div>
                      
                      <button onClick={() => removeNode(node.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Connecting Line to next node (or plus button) */}
                  <div className="h-8 w-px bg-indigo-500/50 relative my-1">
                    <ArrowRight className="w-3 h-3 text-indigo-400 absolute -bottom-1 -left-[5px] rotate-90" />
                  </div>
                </div>
              ))}

              {/* Add Node Button / Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowNodeSelector(!showNodeSelector)}
                  className="w-12 h-12 rounded-full glass-panel border border-indigo-500/50 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 hover:scale-110 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                >
                  <Plus className={`w-6 h-6 transition-transform ${showNodeSelector ? 'rotate-45 text-rose-400' : ''}`} />
                </button>

                {showNodeSelector && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 w-64 glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-50 bg-slate-900/95">
                    <div className="p-3 border-b border-white/5 bg-black/20 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Add Action</div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => addNode('condition', 'If Condition', <Settings2 className="w-5 h-5 text-sky-400" />)} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">If Condition</span>
                      </button>
                      <button onClick={() => addNode('action', 'Ask for Approval', <User className="w-5 h-5 text-fuchsia-400" />)} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <User className="w-4 h-4 text-slate-400 group-hover:text-fuchsia-400" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Ask for Approval</span>
                      </button>
                      <button onClick={() => addNode('action', 'Create Record', <Database className="w-5 h-5 text-emerald-400" />)} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <Database className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Create Record</span>
                      </button>
                      <button onClick={() => addNode('action', 'Send Email', <Mail className="w-5 h-5 text-rose-400" />)} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <Mail className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Send Email</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
  );
}

function DraggableItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="glass-panel border border-white/5 rounded-xl p-3 flex items-start space-x-3 hover:border-white/20 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-sm font-bold text-slate-200">{title}</div>
        <div className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
