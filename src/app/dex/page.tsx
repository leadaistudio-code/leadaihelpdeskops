"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Radio, Cpu, Power, Trash2, CheckCircle2, Zap, History, BrainCircuit, AlertTriangle, Sparkles } from "lucide-react";
import { getDexEndpoints, getDexSummary, queueRemediation, getDexSettings, setAutoHeal, getAppCrashStats, getRecentCrashes, getSoftwareUsageStats, getSecurityPostures, getRemediationCampaigns, createRemediationCampaign, getShadowItSavings, getBurnoutRisks, getSmartContracts, createSmartContract, toggleSmartContract, deleteSmartContract, getLifecycleArbitrage, generateGlobalAgenticScript, deployGlobalAgenticScript, getTenantUsers, type DexEndpoint } from "@/app/actions/dexActions";
import EnrollDevicePanel from "@/components/EnrollDevicePanel";
import DeviceOwnerControl from "@/components/DeviceOwnerControl";
import FleetCopilot from "@/components/FleetCopilot";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useAppTheme } from "@/components/ThemeContext";
import {
  PageHeader,
  Button,
  Panel,
  PanelHeader,
  StatTile,
  Badge,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Field,
  Input,
  Textarea,
  Select,
  cn,
  focusRing,
} from "@/components/ui";

const ACTION_MAP: Record<string, string> = { "Clear Cache": "CLEAR_TEMP", "Remote Reboot": "REBOOT" };

export default function DEXDashboard() {
  const { theme } = useAppTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.3)";
  const axisStrong = isLight ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.8)";
  const gridColor = isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.05)";
  const tooltipBg = isLight ? "rgba(255,255,255,0.97)" : "rgba(15, 23, 42, 0.9)";
  const tooltipBorder = isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.1)";
  const tooltipText = isLight ? "#0f172a" : "#fff";
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [autoActionsTaken, setAutoActionsTaken] = useState(0);
  const [remediationLogs, setRemediationLogs] = useState<{time: string, message: string}[]>([
    { time: '10:45 AM', message: 'Auto-Pilot enabled. System monitoring active.' }
  ]);

  const [endpoints, setEndpoints] = useState<DexEndpoint[]>([]);
  const [summary, setSummary] = useState({ total: 0, online: 0, avgScore: 0, atRisk: 0 });
  const [crashStats, setCrashStats] = useState<{appName: string, appVersion: string, eventType: string, count: number}[]>([]);
  const [recentCrashes, setRecentCrashes] = useState<{id: string, device: string, appName: string, appVersion: string, eventType: string, time: string}[]>([]);
  const [softwareUsage, setSoftwareUsage] = useState<{softwareName: string, foregroundMinutes: number, device: {hostname: string, persona: string | null} | null}[]>([]);
  const [securityPostures, setSecurityPostures] = useState<{bitlockerActive: boolean, firewallActive: boolean, device: {hostname: string, user: string | null} | null}[]>([]);
  const [campaigns, setCampaigns] = useState<{name: string, status: string, totalTargeted: number}[]>([]);
  const [shadowIt, setShadowIt] = useState<{totalSavings: number, unusedLicenses: any[]}>({ totalSavings: 0, unusedLicenses: [] });
  
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", targetCriteria: "ALL", action: "CLEAR_TEMP" });
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const [burnoutRisks, setBurnoutRisks] = useState<any[]>([]);
  const [smartContracts, setSmartContracts] = useState<any[]>([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [newContract, setNewContract] = useState({ name: "", metric: "CPU", operator: ">", threshold: 90, action: "CLEAR_TEMP" });
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [arbitrageData, setArbitrageData] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<{ id: string; name: string }[]>([]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("weekly");

  const [isGlobalAgentModalOpen, setIsGlobalAgentModalOpen] = useState(false);
  const [globalAgentPrompt, setGlobalAgentPrompt] = useState("");
  const [globalAgentModel, setGlobalAgentModel] = useState("gpt-4o-mini");
  const [isExecutingGlobalAgent, setIsExecutingGlobalAgent] = useState(false);
  const [generatedScriptData, setGeneratedScriptData] = useState<{script: string, explanation: string} | null>(null);

  const handleGenerateGlobalAgentScript = async () => {
    if (!globalAgentPrompt.trim()) return;
    setIsExecutingGlobalAgent(true);
    setGeneratedScriptData(null);
    try {
      const res = await generateGlobalAgenticScript(globalAgentPrompt, globalAgentModel);
      setGeneratedScriptData(res);
    } catch (e: any) {
      setToast({ message: e.message || "Failed to generate script.", show: true });
      setTimeout(() => setToast({ message: "", show: false }), 4500);
    } finally {
      setIsExecutingGlobalAgent(false);
    }
  };

  const handleDeployGlobalAgentScript = async () => {
    if (!globalAgentPrompt.trim() || !generatedScriptData?.script) return;
    setIsExecutingGlobalAgent(true);
    try {
      const res = await deployGlobalAgenticScript(globalAgentPrompt, generatedScriptData.script);
      setToast({ message: `Success! Queued agentic script on ${res.deviceCount} devices.`, show: true });
      setIsGlobalAgentModalOpen(false);
      setGlobalAgentPrompt("");
      setGeneratedScriptData(null);
    } catch (e: any) {
      setToast({ message: e.message || "Failed to deploy script.", show: true });
    } finally {
      setIsExecutingGlobalAgent(false);
      setTimeout(() => setToast({ message: "", show: false }), 4500);
    }
  };

  const handleCreateContract = async () => {
    if (!newContract.name.trim()) return;
    setIsCreatingContract(true);
    try {
      const sc = await createSmartContract(newContract.name, newContract.metric, newContract.operator, Number(newContract.threshold), newContract.action);
      setSmartContracts([sc, ...smartContracts]);
      setIsContractModalOpen(false);
      setToast({ message: "Smart Contract deployed successfully!", show: true });
    } catch (e) {
      setToast({ message: "Failed to deploy contract.", show: true });
    } finally {
      setIsCreatingContract(false);
    }
  };

  const handleToggleContract = async (id: string, current: boolean) => {
    try {
      const updated = await toggleSmartContract(id, !current);
      setSmartContracts(smartContracts.map(sc => sc.id === id ? updated : sc));
    } catch {
      setToast({ message: "Failed to toggle contract.", show: true });
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      await deleteSmartContract(id);
      setSmartContracts(smartContracts.filter(sc => sc.id !== id));
      setToast({ message: "Contract deleted.", show: true });
    } catch {
      setToast({ message: "Failed to delete contract.", show: true });
    }
  };


  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) return;
    setIsCreatingCampaign(true);
    try {
      const c = await createRemediationCampaign(newCampaign.name, newCampaign.action, newCampaign.targetCriteria);
      setCampaigns([c, ...campaigns]);
      setIsCampaignModalOpen(false);
      setToast({ message: "Campaign created and commands queued!", show: true });
    } catch (e) {
      setToast({ message: "Failed to create campaign.", show: true });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Charts measure the DOM, so render them client-only to avoid SSR/client
  // hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Auto-Pilot reflects the persisted, tenant-wide self-heal setting.
  useEffect(() => {
    getDexSettings().then((s) => setIsAutoPilotOn(s.autoHeal)).catch(() => {});
  }, []);

  const toggleAutoHeal = async () => {
    const next = !isAutoPilotOn;
    setIsAutoPilotOn(next);
    try {
      await setAutoHeal(next);
    } catch {
      setIsAutoPilotOn(!next); // revert on failure
    }
  };

  // Live device fleet from agent telemetry — poll so devices appear and flip
  // online/offline in near real time.
  useEffect(() => {
    const load = () => {
      getDexEndpoints().then(setEndpoints).catch(() => {});
      getDexSummary().then(setSummary).catch(() => {});
      getAppCrashStats().then(setCrashStats).catch(() => {});
      getRecentCrashes().then(setRecentCrashes).catch(() => {});
      getSoftwareUsageStats().then(setSoftwareUsage).catch(() => {});
      getSecurityPostures().then(setSecurityPostures).catch(() => {});
      getRemediationCampaigns().then(setCampaigns).catch(() => {});
      getShadowItSavings().then(setShadowIt).catch(() => {});
      getBurnoutRisks().then(setBurnoutRisks).catch(() => {});
      getSmartContracts().then(setSmartContracts).catch(() => {});
      getLifecycleArbitrage().then(setArbitrageData).catch(() => {});
      getTenantUsers().then(setTenantUsers).catch(() => {});
    };
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  // Re-fetch just the fleet after an owner change, so the picker reflects the
  // new owner without waiting for the 15s poll.
  const reloadEndpoints = () => { getDexEndpoints().then(setEndpoints).catch(() => {}); };

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

  // Queue a REAL remediation command for the agent to pull and execute on the
  // endpoint. The device's status updates on its next telemetry report.
  const handleRemediation = async (deviceId: string, hostname: string, actionLabel: string, isAuto: boolean = false) => {
    if (isRemediating[hostname]) return;
    const cmd = ACTION_MAP[actionLabel] ?? actionLabel;

    setIsRemediating(prev => ({ ...prev, [hostname]: true }));
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRemediationLogs(prev => [{ time: ts, message: `${isAuto ? '⚡ Auto-Triggered' : '👤 Manual'}: ${actionLabel} queued for ${hostname}` }, ...prev]);
    setToast({ message: `Queued '${actionLabel}' on ${hostname} — the agent will execute on its next check-in.`, show: true });

    try {
      await queueRemediation(deviceId, cmd);
      if (isAuto) setAutoActionsTaken(prev => prev + 1);
    } catch {
      setToast({ message: `Couldn't queue '${actionLabel}' on ${hostname}.`, show: true });
    }

    setTimeout(() => setIsRemediating(prev => ({ ...prev, [hostname]: false })), 3000);
    setTimeout(() => setToast({ message: "", show: false }), 4500);
  };

  // Auto-pilot effect
  // Note: when Auto-Pilot is on, self-heal runs server-side in the metrics
  // ingest route (queues a safe runbook on detection) — so it works even when
  // no one has the dashboard open.

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[9999] rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-medium">{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="DEX Auto-Remediation"
        description={
          <span className="inline-flex items-center gap-2">
            Live endpoint telemetry from enrolled devices
            <Badge tone="success">Live agent data</Badge>
          </span>
        }
        action={
          <>
            <Button variant="secondary" icon={BrainCircuit} onClick={() => setIsGlobalAgentModalOpen(true)}>
              Global Agent Instruction
            </Button>
            <Button variant="secondary" icon={History} onClick={() => setIsReportModalOpen(true)}>
              Generate Report
            </Button>
            <div className={cn(
              "rounded-2xl border px-5 py-3 flex items-center space-x-4 transition-colors",
              isAutoPilotOn ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.02]"
            )}>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Zap className={cn("w-4 h-4", isAutoPilotOn ? "text-emerald-400" : "text-slate-500")} />
                  <span>Proactive Auto-Pilot</span>
                </span>
                <span className="text-xs text-slate-400">{isAutoPilotOn ? 'Monitoring and healing automatically' : 'Manual remediation required'}</span>
              </div>
              <button
                onClick={toggleAutoHeal}
                aria-label="Toggle Proactive Auto-Pilot"
                className={cn(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                  isAutoPilotOn ? "bg-emerald-500" : "bg-slate-700",
                  focusRing
                )}
              >
                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform", isAutoPilotOn ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
          </>
        }
      />

      {/* KPI row — the headline numbers, always in view */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatTile
          label="Experience Score"
          tone={summary.avgScore >= 80 ? "success" : summary.avgScore >= 55 ? "warning" : "critical"}
          value={<span>{summary.avgScore}<span className="text-slate-500 text-lg font-normal ml-1">/ 100</span></span>}
          hint="Fleet average (online devices)"
        />
        <StatTile label="Devices" value={summary.total} />
        <StatTile label="Online" value={summary.online} />
        <StatTile
          label="At Risk"
          tone={summary.atRisk > 0 ? "warning" : "neutral"}
          value={summary.atRisk}
        />
        <StatTile
          label="Auto-Remediations"
          tone={autoActionsTaken > 0 ? "success" : "neutral"}
          value={autoActionsTaken}
          hint="Today"
        />
      </div>

      {/* Onboarding is prominent only until the first device is enrolled. */}
      {summary.total === 0 ? (
        <EnrollDevicePanel />
      ) : (
        <CollapsibleSection title="Enroll a device" subtitle="Add a laptop to this tenant">
          <EnrollDevicePanel />
        </CollapsibleSection>
      )}

      {/* AIOps Predictive Intelligence Panel */}
      <Panel padded className="mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-9 h-9 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span>Predictive Intelligence (AIOps)</span>
              <Badge tone="neutral" dot>Scanning</Badge>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Regression over each device&rsquo;s telemetry trend — projected threshold crossings, not fixed rules.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {arbitrageData.length === 0 ? (
                <div className="md:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-start space-x-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white">No degradation trends detected</div>
                    <div className="text-xs text-slate-400 mt-1">No device&rsquo;s telemetry is trending toward a failure threshold within the next 30 days.</div>
                  </div>
                </div>
              ) : (
                arbitrageData.slice(0, 4).map((a: any, i: number) => {
                  const critical = a.probability >= 70 || a.daysUntilFailure <= 7;
                  return (
                    <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-start space-x-4">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${critical ? "text-rose-500" : "text-amber-500"}`} />
                      <div>
                        <div className="text-sm font-semibold text-white">{a.component === "DISK" ? "Disk capacity" : a.component === "BATTERY" ? "Battery health" : a.component}: {a.device}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Projected to cross its threshold in <span className={`font-semibold ${critical ? "text-rose-400" : "text-amber-400"}`}>~{a.daysUntilFailure} {a.daysUntilFailure === 1 ? "day" : "days"}</span> ({a.probability}% confidence from the observed trend).
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Panel padded className="lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Radio className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Network Latency (ms)</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="time" stroke={axisColor} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px" }}
                  itemStyle={{ color: tooltipText }}
                />
                <Line type="monotone" dataKey="ms" stroke="#00d4a4" strokeWidth={3} dot={{ r: 4, fill: "#00d4a4", strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel padded className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Health</h2>
            </div>
            {isAutoPilotOn && <Badge tone="success" dot>Auto-Healing Active</Badge>}
          </div>
          <div className="flex-1 min-h-[220px]">
            {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceHealthData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={axisColor} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke={axisStrong} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: gridColor}}
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px" }}
                  itemStyle={{ color: tooltipText }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400 font-medium">Auto-Remediations Today</span>
               <span className="font-semibold text-emerald-400 text-lg tabular-nums">{autoActionsTaken}</span>
             </div>
             <div className="flex justify-between items-center text-xs mt-1">
               <span className="text-slate-500">Estimated Admin Time Saved</span>
               <span className="font-semibold text-slate-300 tabular-nums">{(autoActionsTaken * 15).toFixed(0)} mins</span>
             </div>
          </div>
        </Panel>
      </div>

      <CollapsibleSection title="Application reliability" subtitle="Top crashing apps & recent crash events" icon={Activity}>
      <Panel className="overflow-hidden">
        <PanelHeader title="App-DEX: Application Reliability" icon={Activity} />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Top Crashing Applications</h3>
            <div className="space-y-3">
              {crashStats.length === 0 ? (
                <div className="text-slate-500 text-sm italic">No application crashes detected recently.</div>
              ) : (
                crashStats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
                    <div>
                      <div className="text-sm font-semibold text-white">{stat.appName}</div>
                      <div className="text-xs text-slate-400">v{stat.appVersion} &bull; <span className={stat.eventType === "CRASH" ? "text-rose-400" : "text-amber-400"}>{stat.eventType}</span></div>
                    </div>
                    <div className="text-xl font-semibold text-slate-300 tabular-nums">{stat.count}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Crash Events</h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {recentCrashes.length === 0 ? (
                <div className="text-slate-500 text-sm italic">No recent events.</div>
              ) : (
                recentCrashes.map((crash, i) => (
                  <div key={i} className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-300">{crash.device}</span>
                      <span className="text-[10px] text-slate-500">{new Date(crash.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-semibold text-white">{crash.appName}</span> (v{crash.appVersion})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Panel>
      </CollapsibleSection>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Panel className="xl:col-span-2 overflow-visible">
          <PanelHeader title="Active Anomalies & Remediation" />
          <div className="overflow-visible">
            <table className="w-full text-sm text-left text-slate-300">
              <THead>
                <tr>
                  <TH>Endpoint</TH>
                  <TH>User</TH>
                  <TH>Owner</TH>
                  <TH>Score</TH>
                  <TH>CPU</TH>
                  <TH>Mem</TH>
                  <TH>Disk</TH>
                  <TH>Batt</TH>
                  <TH>Status</TH>
                  <TH align="right">Quick Actions</TH>
                </tr>
              </THead>
              <TBody>
                {endpoints.length === 0 ? (
                  <tr><TD colSpan={10} align="center" className="py-12 text-slate-500">No devices enrolled yet. Use “Enroll a device” above to add one.</TD></tr>
                ) : endpoints.map((ep) => (
                  <TR key={ep.deviceId} className={isRemediating[ep.id] ? 'opacity-50 pointer-events-none' : ''}>
                    <TD className="font-semibold text-slate-100">
                      {ep.id}
                      {!ep.online && <span className="ml-2 px-1.5 py-0.5 bg-white/5 text-slate-400 rounded text-[10px] font-semibold uppercase">Offline</span>}
                    </TD>
                    <TD className="text-slate-200">{ep.user}</TD>
                    <TD>
                      <DeviceOwnerControl
                        deviceId={ep.deviceId}
                        currentOwnerId={ep.ownerId}
                        users={tenantUsers}
                        onAssigned={reloadEndpoints}
                      />
                    </TD>
                    <TD>
                      <span className={cn("font-semibold tabular-nums", ep.score >= 80 ? 'text-emerald-400' : ep.score >= 55 ? 'text-amber-400' : 'text-rose-400')}>{ep.online ? ep.score : '—'}</span>
                    </TD>
                    <TD className="font-mono">{ep.cpu}</TD>
                    <TD className="font-mono">{ep.mem}</TD>
                    <TD className="font-mono">{ep.disk}</TD>
                    <TD className="font-mono">{ep.battery}</TD>
                    <TD>
                      <Badge tone={ep.status === 'Critical' ? 'critical' : ep.status === 'Warning' ? 'warning' : 'success'}>
                        {isRemediating[ep.id] ? 'Queued…' : ep.status}
                      </Badge>
                    </TD>
                    <TD align="right">
                      <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleRemediation(ep.deviceId, ep.id, "Clear Cache")}
                        disabled={!ep.online || isRemediating[ep.id] || isAutoPilotOn}
                        aria-label="Clear Temp"
                        className={cn("p-2 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 transition-colors relative group", focusRing)}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Clear Temp</span>
                      </button>
                      <button
                        onClick={() => handleRemediation(ep.deviceId, ep.id, "Remote Reboot")}
                        disabled={!ep.online || isRemediating[ep.id] || isAutoPilotOn}
                        aria-label="Remote Reboot"
                        className={cn("p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 disabled:opacity-30 transition-colors relative group", focusRing)}
                      >
                        <Power className="w-4 h-4" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Remote Reboot</span>
                      </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </table>
          </div>
        </Panel>

        <Panel className="flex flex-col overflow-hidden">
          <PanelHeader title="Remediation History" icon={History} />
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar max-h-[400px]">
            <div className="space-y-3">
              {remediationLogs.map((log, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 animate-in slide-in-from-top-2">
                  <div className="text-xs font-semibold text-slate-500 mt-0.5 w-16 shrink-0">{log.time}</div>
                  <div className={cn("text-sm font-medium", log.message.includes('Auto-Triggered') ? 'text-emerald-400' : 'text-slate-300')}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <CollapsibleSection title="Fleet Copilot" subtitle="Ask about the fleet in natural language" icon={Sparkles}>
        <FleetCopilot />
      </CollapsibleSection>

      <CollapsibleSection title="Shadow IT & unused licenses" subtitle="Reclaim wasted SaaS spend" icon={Activity}>
      <Panel padded>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </span>
              <span>Shadow IT Cost-Killer</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Unused paid SaaS licenses detected on endpoints (inactive &gt; 72h).</p>

            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Waste Found</p>
                <div className="text-4xl font-semibold text-rose-400 tabular-nums">${shadowIt.totalSavings}<span className="text-lg text-slate-500 ml-1 font-normal">/mo</span></div>
              </div>
              <Button variant="danger">Revoke All Licenses</Button>
            </div>
          </div>

          <div className="flex-[1.5]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Wasted Licenses</h3>
            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
              {shadowIt.unusedLicenses.length === 0 ? (
                <div className="text-slate-500 text-sm italic">No wasted licenses detected!</div>
              ) : (
                shadowIt.unusedLicenses.map((lic: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/10">
                    <div>
                      <div className="text-sm font-semibold text-white capitalize">{lic.software}</div>
                      <div className="text-xs text-slate-400">{lic.device} ({lic.user}) &bull; Last seen: {lic.lastUsedAt ? new Date(lic.lastUsedAt).toLocaleDateString() : 'Never'}</div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="text-sm font-semibold text-rose-400 tabular-nums">${lic.cost}/mo</div>
                      <Button variant="secondary" size="sm">Revoke</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Panel>
      </CollapsibleSection>

      <CollapsibleSection title="Automation & people" subtitle="Self-healing contracts and burnout risk" icon={Zap}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Self-Healing Smart Contracts */}
        <Panel padded>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </span>
              <span>Self-Healing Smart Contracts</span>
            </h2>
            <Button size="sm" onClick={() => setIsContractModalOpen(true)}>Deploy Contract</Button>
          </div>
          <p className="text-sm text-slate-400 mb-4">Autonomous runbooks triggered instantly by local endpoint telemetry.</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {smartContracts.length === 0 ? (
              <div className="text-slate-500 text-sm italic p-4 bg-white/[0.02] rounded-xl border border-white/10 text-center">No active contracts. Deploy one to automate remediation.</div>
            ) : (
              smartContracts.map((sc: any) => (
                <div key={sc.id} className="flex flex-col p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/15 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-semibold text-white">{sc.name}</div>
                    <div className="flex items-center space-x-3">
                      <Badge tone="neutral">{sc.triggersCount} executions</Badge>
                      <button onClick={() => handleToggleContract(sc.id, sc.isActive)} aria-label="Toggle contract" className={cn("w-8 h-4 rounded-full transition-colors relative", sc.isActive ? 'bg-[#0a0a0a]' : 'bg-slate-700', focusRing)}>
                        <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", sc.isActive ? 'translate-x-4' : 'translate-x-0')} />
                      </button>
                      <button onClick={() => handleDeleteContract(sc.id)} aria-label="Delete contract" className={cn("text-slate-500 hover:text-rose-400 transition-colors rounded-sm", focusRing)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-slate-300 font-mono bg-black/20 p-2 rounded border border-white/10">
                    <span className="text-slate-500 mr-2">IF</span> {sc.metric} {sc.operator} {sc.threshold} <span className="text-slate-500 mx-2">THEN</span> {sc.action}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        {/* Predictive Burnout Engine (HR) */}
        <Panel padded>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span>Predictive Burnout Risk (HR)</span>
            </h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Employees with critical IT friction flagged for proactive intervention.</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {burnoutRisks.length === 0 ? (
              <div className="text-slate-500 text-sm italic p-4 bg-white/[0.02] rounded-xl border border-white/10 text-center">No high-risk employees detected.</div>
            ) : (
              burnoutRisks.map((risk: any, i: number) => (
                <div key={i} className="flex flex-col p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/15 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {risk.user} <span className="text-xs font-mono text-slate-500">({risk.hostname})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{risk.reason}</div>
                    </div>
                    <Badge tone={risk.riskLevel === 'CRITICAL' ? 'critical' : 'warning'}>{risk.riskLevel}</Badge>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="secondary" size="sm">Approve Upgrade</Button>
                    <Button variant="secondary" size="sm">Alert HR</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
      </CollapsibleSection>

      <CollapsibleSection title="Hardware lifecycle arbitrage" subtitle="Optimal resale windows before failure" icon={Zap}>
      <Panel padded>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </span>
              <span>Hardware Lifecycle Arbitrage</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Predictive resale value optimization. Sell hardware at peak refurbished value right before predicted component failure.</p>

            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Value at Risk</p>
                <div className="text-4xl font-semibold text-white tabular-nums">${arbitrageData.reduce((acc, a) => acc + a.valueAtRisk, 0)}</div>
                <p className="text-xs text-slate-500 mt-1">If these devices fail before resale.</p>
              </div>
              <Button variant="secondary">Bulk Resale Process</Button>
            </div>
          </div>

          <div className="flex-[1.5]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Optimal Resale Window</h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
              {arbitrageData.length === 0 ? (
                <div className="text-slate-500 text-sm italic">No devices currently in their optimal resale window.</div>
              ) : (
                arbitrageData.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/15 transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {a.device} <span className="text-xs font-mono text-slate-500">({a.persona})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Predicting <span className="font-semibold text-rose-400">{a.component}</span> failure in <span className="font-semibold text-amber-400">{a.daysUntilFailure} days</span> ({a.probability}% confidence).
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-100 tabular-nums">${a.currentResaleValue}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Value</div>
                      </div>
                      <Button variant="secondary" size="sm">Sell Asset</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Panel>
      </CollapsibleSection>

      <CollapsibleSection title="Enterprise AIOps modules" subtitle="FinOps, security posture, campaigns" icon={BrainCircuit}>
      <Panel className="overflow-hidden">
        <PanelHeader title="Enterprise AIOps Modules" icon={BrainCircuit} />
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FinOps */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">FinOps (Software Usage)</h3>
            <div className="space-y-3">
              {softwareUsage.length === 0 ? <div className="text-slate-500 text-sm italic">No usage data.</div> :
                softwareUsage.map((u, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/10">
                    <div>
                      <div className="text-sm font-semibold text-white">{u.softwareName}</div>
                      <div className="text-xs text-slate-400">{u.device?.hostname} ({u.device?.persona || 'Unknown'})</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 tabular-nums">{u.foregroundMinutes}m</div>
                  </div>
                ))}
            </div>
          </div>
          {/* Security */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Security Posture Drift</h3>
            <div className="space-y-3">
              {securityPostures.length === 0 ? <div className="text-slate-500 text-sm italic">No security events.</div> :
                securityPostures.map((s, i) => (
                  <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/10">
                    <div className="text-sm font-semibold text-white mb-1">{s.device?.hostname}</div>
                    <div className="flex gap-2 text-xs font-mono">
                      <span className={s.bitlockerActive ? 'text-emerald-400' : 'text-rose-400'}>BitLocker:{s.bitlockerActive ? 'ON' : 'OFF'}</span>
                      <span className={s.firewallActive ? 'text-emerald-400' : 'text-rose-400'}>Firewall:{s.firewallActive ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Campaigns */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Campaigns</h3>
              <Button size="sm" onClick={() => setIsCampaignModalOpen(true)}>New</Button>
            </div>
            <div className="space-y-3">
              {campaigns.length === 0 ? <div className="text-slate-500 text-sm italic">No active campaigns.</div> :
                campaigns.map((c, i) => (
                  <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      <Badge tone="warning">{c.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-400">Targeting {c.totalTargeted} devices</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Panel>
      </CollapsibleSection>

      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Panel className="p-6 w-full max-w-md bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-semibold text-white mb-4">Create Campaign</h2>
            <div className="space-y-4">
              <Field label="Campaign Name">
                <Input type="text" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} placeholder="e.g. Enforce Firewall" />
              </Field>
              <Field label="Target Devices">
                <Select value={newCampaign.targetCriteria} onChange={e => setNewCampaign({...newCampaign, targetCriteria: e.target.value})}>
                  <option value="ALL">All Enrolled Devices</option>
                  <option value="FIREWALL_OFF">Devices with Firewall Disabled</option>
                  <option value="BITLOCKER_OFF">Devices with BitLocker Disabled</option>
                </Select>
              </Field>
              <Field label="Runbook Action">
                <Select value={newCampaign.action} onChange={e => setNewCampaign({...newCampaign, action: e.target.value})}>
                  <option value="CLEAR_TEMP">Clear Temporary Files</option>
                  <option value="FLUSH_DNS">Flush DNS Cache</option>
                  <option value="RESTART_SPOOLER">Restart Print Spooler</option>
                  <option value="RESTART_EXPLORER">Restart Windows Explorer</option>
                  <option value="UPDATE_GPO">Force Group Policy Update (gpupdate)</option>
                  <option value="SYNC_TIME">Resync System Clock (w32tm)</option>
                  <option value="EMPTY_RECYCLE_BIN">Empty Recycle Bin</option>
                  <option value="RESTART_AUDIO">Restart Audio Services</option>
                  <option value="KILL_HIGH_MEM">Kill High Memory Apps (&gt;2GB)</option>
                  <option value="RESET_NETWORK">Release/Renew IP (Network Reset)</option>
                  <option value="REBOOT">Force Reboot (Dangerous)</option>
                </Select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setIsCampaignModalOpen(false)}>Cancel</Button>
              <Button disabled={!newCampaign.name || isCreatingCampaign} loading={isCreatingCampaign} onClick={handleCreateCampaign}>
                {isCreatingCampaign ? "Creating..." : "Launch Campaign"}
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {isContractModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Panel className="p-6 w-full max-w-md bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-slate-400" /> Deploy Smart Contract
            </h2>
            <div className="space-y-4">
              <Field label="Contract Name">
                <Input type="text" value={newContract.name} onChange={e => setNewContract({...newContract, name: e.target.value})} placeholder="e.g. Prevent CPU Thermal Event" />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Metric">
                  <Select value={newContract.metric} onChange={e => setNewContract({...newContract, metric: e.target.value})}>
                    <option value="CPU">CPU %</option>
                    <option value="RAM">RAM %</option>
                    <option value="DISK">Disk %</option>
                  </Select>
                </Field>
                <Field label="Operator">
                  <Select value={newContract.operator} onChange={e => setNewContract({...newContract, operator: e.target.value})}>
                    <option value=">">Greater (&gt;)</option>
                    <option value="<">Less (&lt;)</option>
                  </Select>
                </Field>
                <Field label="Threshold">
                  <Input type="number" value={newContract.threshold} onChange={e => setNewContract({...newContract, threshold: Number(e.target.value)})} />
                </Field>
              </div>
              <Field label="Execution Action">
                <Select value={newContract.action} onChange={e => setNewContract({...newContract, action: e.target.value})}>
                  <option value="CLEAR_TEMP">Clear Temporary Files</option>
                  <option value="FLUSH_DNS">Flush DNS Cache</option>
                  <option value="RESTART_SPOOLER">Restart Print Spooler</option>
                  <option value="RESTART_EXPLORER">Restart Windows Explorer</option>
                  <option value="UPDATE_GPO">Force Group Policy Update (gpupdate)</option>
                  <option value="SYNC_TIME">Resync System Clock (w32tm)</option>
                  <option value="EMPTY_RECYCLE_BIN">Empty Recycle Bin</option>
                  <option value="RESTART_AUDIO">Restart Audio Services</option>
                  <option value="KILL_HIGH_MEM">Kill High Memory Apps (&gt;2GB)</option>
                  <option value="RESET_NETWORK">Release/Renew IP (Network Reset)</option>
                  <option value="REBOOT">Force Reboot (Dangerous)</option>
                </Select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setIsContractModalOpen(false)}>Cancel</Button>
              <Button disabled={!newContract.name || isCreatingContract} loading={isCreatingContract} onClick={handleCreateContract}>
                {isCreatingContract ? "Deploying..." : "Deploy Contract"}
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Panel className="p-6 w-full max-w-md bg-slate-900 shadow-2xl relative">
            <h3 className="text-lg font-semibold text-white mb-2">Generate DEX Report</h3>
            <p className="text-slate-400 text-sm mb-6">Create a comprehensive, printable summary of endpoint telemetry, stability, security drift, and hardware risks.</p>

            <div className="space-y-4 mb-8">
              <Field label="Timeframe">
                <Select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                  <option value="daily">Daily (Last 24 Hours)</option>
                  <option value="weekly">Weekly (Last 7 Days)</option>
                  <option value="monthly">Monthly (Last 30 Days)</option>
                </Select>
              </Field>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  window.open(`/dex/report?period=${reportPeriod}`, '_blank');
                  setIsReportModalOpen(false);
                }}
              >
                Generate Report
              </Button>
            </div>
          </Panel>
        </div>
      )}
      {isGlobalAgentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Panel className="p-6 w-full max-w-lg bg-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-slate-400" />
              Global Agentic Instruction
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Enter a natural language instruction and select an AI model. The AI will generate a script for you to preview before deploying to <strong>ALL</strong> enrolled devices.
            </p>

            <div className="space-y-4 mb-6">
              <Field label="Model">
                <Select
                  value={globalAgentModel}
                  onChange={(e) => setGlobalAgentModel(e.target.value)}
                  disabled={!!generatedScriptData || isExecutingGlobalAgent}
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                  <option value="gpt-4o">GPT-4o (Most Capable)</option>
                </Select>
              </Field>

              <Field label="Instruction Prompt">
                <Textarea
                  value={globalAgentPrompt}
                  onChange={(e) => {
                    setGlobalAgentPrompt(e.target.value);
                    setGeneratedScriptData(null); // Reset preview on edit
                  }}
                  className="min-h-[100px] resize-none"
                  placeholder="e.g. Empty the recycle bin for all users"
                  disabled={isExecutingGlobalAgent && !generatedScriptData}
                />
              </Field>

              {generatedScriptData && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Script Generated
                  </h4>
                  <p className="text-sm text-slate-300 mb-3">{generatedScriptData.explanation}</p>
                  <div className="bg-black/50 border border-white/10 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs font-mono text-slate-300">{generatedScriptData.script}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsGlobalAgentModalOpen(false);
                  setGeneratedScriptData(null);
                }}
                disabled={isExecutingGlobalAgent}
              >
                Cancel
              </Button>

              {!generatedScriptData ? (
                <Button
                  onClick={handleGenerateGlobalAgentScript}
                  disabled={!globalAgentPrompt.trim() || isExecutingGlobalAgent}
                  loading={isExecutingGlobalAgent}
                >
                  {isExecutingGlobalAgent ? "Generating..." : "Generate Preview"}
                </Button>
              ) : (
                <Button
                  onClick={handleDeployGlobalAgentScript}
                  disabled={isExecutingGlobalAgent}
                  loading={isExecutingGlobalAgent}
                >
                  {isExecutingGlobalAgent ? "Deploying..." : "Deploy Globally"}
                </Button>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
