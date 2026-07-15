"use client";

import { useState, useEffect } from "react";
import { Workflow, Plus, Trash2, ArrowRight, Play, Save, FolderOpen, GitCommit, Settings2, Zap, Clock, User, Mail, Database } from "lucide-react";
import { getFlows, saveFlow, deleteFlow, type SavedFlow } from "@/app/actions/flowActions";
import { toast } from "@/components/toast";
import { Panel, Button, Badge, cn, focusRing } from "@/components/ui";

// Rebuild a node icon from its type when loading a saved flow.
function nodeGlyph(type: string): React.ReactElement {
  if (type === "trigger") return <Zap className="w-5 h-5 text-amber-400" />;
  if (type === "condition") return <Settings2 className="w-5 h-5 text-sky-400" />;
  return <Database className="w-5 h-5 text-emerald-400" />;
}

export default function FlowDesigner() {
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [showFlows, setShowFlows] = useState(false);

  const loadFlows = () => { getFlows().then(setSavedFlows).catch(() => {}); };
  useEffect(() => { loadFlows(); }, []);

  const handleSaveFlow = async () => {
    const name = window.prompt("Save flow as:", "Hardware Provisioning Flow");
    if (!name) return;
    try {
      await saveFlow(name, nodes.map(({ id, type, name, desc }) => ({ id, type, name, desc })));
      toast("Flow saved");
      loadFlows();
    } catch {
      toast("Couldn't save flow", "error");
    }
  };

  const handleLoadFlow = (flow: SavedFlow) => {
    setNodes(flow.nodes.map((n) => ({ ...n, icon: nodeGlyph(n.type) })));
    setShowFlows(false);
    toast(`Loaded "${flow.name}"`);
  };

  const handleDeleteFlow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteFlow(id);
      toast("Flow deleted");
      loadFlows();
    } catch {
      toast("Couldn't delete flow", "error");
    }
  };

  const [nodes, setNodes] = useState([
    { id: 1, type: "trigger", name: "Service Catalog Request Created", desc: "Triggered when 'MacBook Pro' is requested", icon: <Zap className="w-5 h-5 text-amber-400" /> },
    { id: 2, type: "condition", name: "Check Caller Department", desc: "If Department == 'Engineering'", icon: <Settings2 className="w-5 h-5 text-sky-400" /> },
    { id: 3, type: "action", name: "Ask for Manager Approval", desc: "Wait for State = Approved", icon: <User className="w-5 h-5 text-fuchsia-400" /> },
    { id: 4, type: "action", name: "Create Procurement Task", desc: "Assigned to Hardware Group", icon: <Database className="w-5 h-5 text-emerald-400" /> }
  ]);

  const [showNodeSelector, setShowNodeSelector] = useState(false);

  const addNode = (type: string, name: string, icon: React.ReactElement) => {
    const nextId = nodes.length ? Math.max(...nodes.map((n) => n.id)) + 1 : 1;
    setNodes([...nodes, { id: nextId, type, name, desc: "Configure this node", icon }]);
    setShowNodeSelector(false);
  };

  const removeNode = (id: number) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col relative z-10 overflow-hidden bg-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-20">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Hardware Provisioning Flow</span>
            <Badge tone="success">Active</Badge>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Automates the approval and fulfillment process for developer hardware.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Button variant="secondary" icon={FolderOpen} onClick={() => setShowFlows((s) => !s)}>
              Saved Flows ({savedFlows.length})
            </Button>
            {showFlows && (
              <Panel className="absolute right-0 top-12 w-80 shadow-2xl overflow-hidden z-50 bg-slate-900/95">
                <div className="p-3 border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Flows</div>
                {savedFlows.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">No saved flows yet. Build one and click Save.</p>
                ) : (
                  <div className="p-2 space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                    {savedFlows.map((f) => (
                      <button key={f.id} onClick={() => handleLoadFlow(f)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group", focusRing)}>
                        <Workflow className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-200 truncate">{f.name}</div>
                          <div className="text-xs text-slate-500">{f.nodes.length} steps</div>
                        </div>
                        <button onClick={(e) => handleDeleteFlow(f.id, e)} className={cn("p-1.5 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity", focusRing)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </div>
          <Button variant="secondary" icon={Play}>Test Flow</Button>
          <Button icon={Save} onClick={handleSaveFlow}>Save Flow</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Library Sidebar */}
        <div className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col z-20">
          <div className="p-4 border-b border-white/5 font-semibold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
            <LibraryIcon />
            <span>Action Library</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Triggers</h3>
              <div className="space-y-2">
                <DraggableItem icon={<Zap className="w-4 h-4 text-amber-400" />} title="Record Created" desc="Runs when a record is inserted" />
                <DraggableItem icon={<Clock className="w-4 h-4 text-amber-400" />} title="Scheduled Timer" desc="Runs daily, weekly, or monthly" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Logic</h3>
              <div className="space-y-2">
                <DraggableItem icon={<Settings2 className="w-4 h-4 text-sky-400" />} title="If Condition" desc="Branch based on field values" />
                <DraggableItem icon={<GitCommit className="w-4 h-4 text-sky-400" />} title="For Each" desc="Iterate over a list of records" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Actions</h3>
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
                  <div className={`w-full border rounded-2xl p-5 group relative transition-colors ${
                    node.type === 'trigger' ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50' :
                    node.type === 'condition' ? 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/50' :
                    'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}>

                    {/* Step Number Badge */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-semibold text-slate-300">
                      {idx + 1}
                    </div>

                    <div className="flex items-start justify-between ml-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                          {node.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-semibold text-white">{node.name}</h3>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{node.type}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{node.desc}</p>
                        </div>
                      </div>

                      <button onClick={() => removeNode(node.id)} className={cn("p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100", focusRing)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Connecting Line to next node (or plus button) */}
                  <div className="h-8 w-px bg-white/15 relative my-1">
                    <ArrowRight className="w-3 h-3 text-slate-500 absolute -bottom-1 -left-[5px] rotate-90" />
                  </div>
                </div>
              ))}

              {/* Add Node Button / Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowNodeSelector(!showNodeSelector)}
                  className={cn("w-12 h-12 rounded-full border border-[#00d4a4]/40 bg-white/[0.02] flex items-center justify-center text-[#00926f] hover:bg-[#1c1c1e]/10 transition-colors", focusRing)}
                >
                  <Plus className={`w-6 h-6 transition-transform ${showNodeSelector ? 'rotate-45 text-rose-400' : ''}`} />
                </button>

                {showNodeSelector && (
                  <Panel className="absolute top-16 left-1/2 -translate-x-1/2 w-64 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-50 bg-slate-900/95">
                    <div className="p-3 border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Add Action</div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => addNode('condition', 'If Condition', <Settings2 className="w-5 h-5 text-sky-400" />)} className={cn("w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group", focusRing)}>
                        <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white">If Condition</span>
                      </button>
                      <button onClick={() => addNode('action', 'Ask for Approval', <User className="w-5 h-5 text-fuchsia-400" />)} className={cn("w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group", focusRing)}>
                        <User className="w-4 h-4 text-slate-400 group-hover:text-fuchsia-400" />
                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Ask for Approval</span>
                      </button>
                      <button onClick={() => addNode('action', 'Create Record', <Database className="w-5 h-5 text-emerald-400" />)} className={cn("w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group", focusRing)}>
                        <Database className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Create Record</span>
                      </button>
                      <button onClick={() => addNode('action', 'Send Email', <Mail className="w-5 h-5 text-rose-400" />)} className={cn("w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group", focusRing)}>
                        <Mail className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Send Email</span>
                      </button>
                    </div>
                  </Panel>
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

function DraggableItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="border border-white/5 rounded-xl bg-white/[0.02] p-3 flex items-start space-x-3 hover:border-white/20 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-slate-200">{title}</div>
        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
