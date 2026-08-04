"use client";

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Radio, Cpu, Power, Trash2, CheckCircle2, Zap, History, BrainCircuit, AlertTriangle, Sparkles } from "lucide-react";
import { getDexEndpoints, getDexSummary, queueRemediation, getDexSettings, setAutoHeal, getAppCrashStats, getRecentCrashes, getSoftwareUsageStats, getSecurityPostures, getRemediationCampaigns, createRemediationCampaign, getShadowItSavings, getBurnoutRisks, getSmartContracts, createSmartContract, toggleSmartContract, deleteSmartContract, getLifecycleArbitrage, queueFleetRemediation, getTenantUsers, getLatencyTrend, getFleetHealthBreakdown, getRemediationStats, getRemediationHistory, getBootPerformance, getNetworkQuality, getSentimentSummary, type DexEndpoint } from "@/app/actions/dexActions";
import EnrollDevicePanel from "@/components/EnrollDevicePanel";

// Row shapes derived from the server actions that return them, rather than
// restated as `any[]`. If an action's shape changes, this page stops compiling
// instead of rendering `undefined` into the DOM.
type UnusedLicense = Awaited<ReturnType<typeof getShadowItSavings>>["unusedLicenses"][number];
type BurnoutRisk = Awaited<ReturnType<typeof getBurnoutRisks>>[number];
type SmartContract = Awaited<ReturnType<typeof getSmartContracts>>[number];
type ArbitrageRow = Awaited<ReturnType<typeof getLifecycleArbitrage>>[number];
type LatencyTrend = Awaited<ReturnType<typeof getLatencyTrend>>;
type FleetHealth = Awaited<ReturnType<typeof getFleetHealthBreakdown>>;
type RemediationStats = Awaited<ReturnType<typeof getRemediationStats>>;
type RemediationHistoryRow = Awaited<ReturnType<typeof getRemediationHistory>>[number];
type BootPerformance = Awaited<ReturnType<typeof getBootPerformance>>;
type NetworkQuality = Awaited<ReturnType<typeof getNetworkQuality>>;
type SentimentSummary = Awaited<ReturnType<typeof getSentimentSummary>>;
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
  Select,
  cn,
  focusRing,
  Tabs,
  TabPanel,
  useTabs,
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

  const [endpoints, setEndpoints] = useState<DexEndpoint[]>([]);
  const [summary, setSummary] = useState({ total: 0, online: 0, avgScore: 0, atRisk: 0 });
  const [crashStats, setCrashStats] = useState<{appName: string, appVersion: string, eventType: string, count: number}[]>([]);
  const [recentCrashes, setRecentCrashes] = useState<{id: string, device: string, appName: string, appVersion: string, eventType: string, time: string}[]>([]);
  const [softwareUsage, setSoftwareUsage] = useState<{softwareName: string, foregroundMinutes: number, device: {hostname: string, persona: string | null} | null}[]>([]);
  const [securityPostures, setSecurityPostures] = useState<{bitlockerActive: boolean, firewallActive: boolean, device: {hostname: string, user: string | null} | null}[]>([]);
  const [campaigns, setCampaigns] = useState<{name: string, status: string, totalTargeted: number}[]>([]);
  const [shadowIt, setShadowIt] = useState<{ totalSavings: number; unusedLicenses: UnusedLicense[] }>({ totalSavings: 0, unusedLicenses: [] });
  
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", targetCriteria: "ALL", action: "CLEAR_TEMP" });
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const [burnoutRisks, setBurnoutRisks] = useState<BurnoutRisk[]>([]);
  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [newContract, setNewContract] = useState({ name: "", metric: "CPU", operator: ">", threshold: 90, action: "CLEAR_TEMP" });
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [arbitrageData, setArbitrageData] = useState<ArbitrageRow[]>([]);
  const [tenantUsers, setTenantUsers] = useState<{ id: string; name: string }[]>([]);

  // Real telemetry replacing the hardcoded arrays that used to render under the
  // "Live agent data" badge. Each starts empty and the UI says so until the
  // agent has actually reported — no plausible filler.
  const [latency, setLatency] = useState<LatencyTrend | null>(null);
  const [fleetHealth, setFleetHealth] = useState<FleetHealth | null>(null);
  const [remediation, setRemediation] = useState<RemediationStats | null>(null);
  const [remediationHistory, setRemediationHistory] = useState<RemediationHistoryRow[]>([]);
  const [boot, setBoot] = useState<BootPerformance | null>(null);
  const [network, setNetwork] = useState<NetworkQuality | null>(null);
  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("weekly");

  // Fleet-wide remediation is limited to the named runbook actions the agent
  // compiles in. The previous "describe it and an AI writes PowerShell" flow was
  // removed: it queued arbitrary script text for every endpoint in the tenant.
  const [isFleetActionModalOpen, setIsFleetActionModalOpen] = useState(false);
  const [fleetAction, setFleetAction] = useState("CLEAR_TEMP");
  const [isDeployingFleetAction, setIsDeployingFleetAction] = useState(false);

  const handleDeployFleetAction = async () => {
    setIsDeployingFleetAction(true);
    try {
      const res = await queueFleetRemediation(fleetAction);
      setToast({ message: `Queued ${fleetAction} on ${res.deviceCount} devices.`, show: true });
      setIsFleetActionModalOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to queue fleet action.";
      setToast({ message: msg, show: true });
    } finally {
      setIsDeployingFleetAction(false);
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
      // `updated` is null if the row vanished between the write and the re-read
      // (deleted in another tab, say). Keep the existing row rather than
      // splicing a null into the list and crashing the next render.
      if (updated) setSmartContracts(smartContracts.map(sc => (sc.id === id ? updated : sc)));
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
      getLatencyTrend().then(setLatency).catch(() => {});
      getFleetHealthBreakdown().then(setFleetHealth).catch(() => {});
      getRemediationStats().then(setRemediation).catch(() => {});
      getRemediationHistory().then(setRemediationHistory).catch(() => {});
      getBootPerformance().then(setBoot).catch(() => {});
      getNetworkQuality().then(setNetwork).catch(() => {});
      getSentimentSummary().then(setSentiment).catch(() => {});
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

  // Derived from real data. `fleetHealth` counts come from the same experience
  // score the device table below renders, so the chart and the tiles can no
  // longer contradict each other.
  const latencyData = latency?.points ?? [];
  const deviceHealthData = fleetHealth
    ? [
        { name: "Healthy", value: fleetHealth.healthy, fill: "#34d399" },
        { name: "Warning", value: fleetHealth.warning, fill: "#F5B14C" },
        { name: "Critical", value: fleetHealth.critical, fill: "#FF6B7D" },
      ]
    : [];

  // Queue a REAL remediation command for the agent to pull and execute on the
  // endpoint. The device's status updates on its next telemetry report.
  const handleRemediation = async (deviceId: string, hostname: string, actionLabel: string, isAuto: boolean = false) => {
    if (isRemediating[hostname]) return;
    const cmd = ACTION_MAP[actionLabel] ?? actionLabel;

    setIsRemediating(prev => ({ ...prev, [hostname]: true }));
    setToast({ message: `Queued '${actionLabel}' on ${hostname} — the agent will execute on its next check-in.`, show: true });

    try {
      await queueRemediation(deviceId, cmd);
      // Re-read from RemoteCommand rather than incrementing a local counter.
      // The old counter reset to zero on every page load and counted "queued",
      // not "completed" — so it reported work the agent may never have done.
      getRemediationHistory().then(setRemediationHistory).catch(() => {});
      getRemediationStats().then(setRemediation).catch(() => {});
    } catch {
      setToast({ message: `Couldn't queue '${actionLabel}' on ${hostname}.`, show: true });
    }

    setTimeout(() => setIsRemediating(prev => ({ ...prev, [hostname]: false })), 3000);
    setTimeout(() => setToast({ message: "", show: false }), 4500);
  };

  // Auto-pilot note: when it is on, self-heal runs server-side in the metrics
  // ingest route (queues a safe runbook on detection) — so it works even when
  // no one has the dashboard open.

  // Which sections are on screen. The page carried thirteen stacked modules and
  // the operator had to scroll past all of them to reach any one; they are the
  // same modules, grouped so the default view answers one question.
  const { id: tabsId, value: tab, setValue: setTab } = useTabs("overview");

  // The triage list: degraded devices and telemetry trending toward a threshold,
  // merged into one ranked list. Previously the operator had to read the device
  // table and the predictions panel separately and join them by hostname.
  const needsAttention = useMemo(() => {
    const items: {
      key: string;
      hostname: string;
      reason: string;
      severity: "critical" | "warning";
      deviceId: string | null;
      online: boolean;
    }[] = [];

    for (const p of arbitrageData.slice(0, 6)) {
      const critical = p.probability >= 70 || p.daysUntilFailure <= 7;
      const part =
        p.component === "DISK" ? "Disk capacity" : p.component === "BATTERY" ? "Battery health" : p.component;
      items.push({
        key: `pred-${p.id}`,
        hostname: p.device,
        reason: `${part} crosses its threshold in ~${p.daysUntilFailure} ${p.daysUntilFailure === 1 ? "day" : "days"} · ${p.probability}% confidence`,
        severity: critical ? "critical" : "warning",
        deviceId: null,
        online: false,
      });
    }

    for (const e of endpoints) {
      if (e.status === "Healthy") continue;
      items.push({
        key: `dev-${e.deviceId}`,
        hostname: e.id,
        reason: !e.online
          ? "Offline — no telemetry received recently"
          : `Experience score ${e.score} · CPU ${e.cpu} · disk ${e.disk}`,
        severity: e.status === "Critical" ? "critical" : "warning",
        deviceId: e.deviceId,
        online: e.online,
      });
    }

    // Critical first, then by hostname so the order is stable across the 15s
    // poll — a list that reshuffles under the cursor cannot be clicked.
    return items.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return a.hostname.localeCompare(b.hostname);
    });
  }, [arbitrageData, endpoints]);

  const tabItems = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: Activity, badge: needsAttention.length },
      { id: "performance", label: "Performance", icon: Radio },
      { id: "reliability", label: "Reliability", icon: AlertTriangle },
      { id: "automation", label: "Automation", icon: Zap },
      { id: "cost", label: "Cost", icon: BrainCircuit },
    ],
    [needsAttention.length]
  );

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[9999] rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-medium">{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Digital employee experience"
        description="Live telemetry from every enrolled device"
        action={
          <>
            <Button variant="secondary" icon={BrainCircuit} onClick={() => setIsFleetActionModalOpen(true)}>
              Fleet action
            </Button>
            <Button variant="secondary" icon={History} onClick={() => setIsReportModalOpen(true)}>
              Report
            </Button>
            {/* Auto-Pilot is one control now, not a bordered card carrying a
                two-line explanation. Its state is legible from the switch and a
                single word; the paragraph was restating the switch. */}
            <label className="flex cursor-pointer items-center gap-3 pl-1">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Zap className={cn("h-4 w-4", isAutoPilotOn ? "text-emerald-400" : "text-slate-500")} aria-hidden />
                Auto-pilot
              </span>
              <button
                onClick={toggleAutoHeal}
                role="switch"
                aria-checked={isAutoPilotOn}
                aria-label="Automatically remediate detected issues"
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isAutoPilotOn ? "bg-emerald-500" : "bg-slate-700",
                  focusRing
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isAutoPilotOn ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </label>
          </>
        }
      />

      {/* Four numbers, not five. "Devices" and "Online" were two tiles carrying
          one fact between them; they are now one tile reading "42 / 45". */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Experience score"
          tone={summary.avgScore >= 80 ? "success" : summary.avgScore >= 55 ? "warning" : "critical"}
          value={
            <span>
              {summary.avgScore}
              <span className="ml-1 text-lg font-normal text-slate-500">/ 100</span>
            </span>
          }
          hint="Fleet average"
        />
        <StatTile
          label="Online"
          value={
            <span>
              {summary.online}
              <span className="ml-1 text-lg font-normal text-slate-500">/ {summary.total}</span>
            </span>
          }
          hint="Devices reporting"
        />
        <StatTile
          label="Needs attention"
          tone={needsAttention.length > 0 ? "warning" : "success"}
          value={needsAttention.length}
          hint={needsAttention.length === 0 ? "Fleet is healthy" : "Devices and predictions"}
        />
        <StatTile
          label="Fixed today"
          tone={(remediation?.completedToday ?? 0) > 0 ? "success" : "neutral"}
          value={remediation?.completedToday ?? 0}
          hint={remediation?.pending ? `${remediation.pending} pending` : "Remediations completed"}
        />
      </div>

      <Tabs items={tabItems} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <TabPanel id="overview" tabsId={tabsId}>
          {/* The triage list. This is the screen's reason to exist: the answer
              to "what needs me right now", placed above the full inventory. */}
          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel className="xl:col-span-2">
              <PanelHeader title="Needs attention" icon={AlertTriangle} />
              {needsAttention.length === 0 ? (
                <div className="flex items-center gap-3 p-6 text-sm text-slate-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                  Nothing needs attention. No device is degraded and no telemetry is trending toward a
                  threshold.
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {needsAttention.map((item) => (
                    <li key={item.key} className="flex items-center gap-4 px-6 py-3.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          item.severity === "critical" ? "bg-rose-400" : "bg-amber-400"
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-100">{item.hostname}</p>
                        <p className="truncate text-xs text-slate-400">{item.reason}</p>
                      </div>
                      {item.deviceId && item.online && !isAutoPilotOn && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isRemediating[item.hostname]}
                          onClick={() => handleRemediation(item.deviceId as string, item.hostname, "Clear Cache")}
                        >
                          {isRemediating[item.hostname] ? "Queued" : "Clear cache"}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel className="flex flex-col overflow-hidden">
              <PanelHeader title="Recent activity" icon={History} />
              <div className="custom-scrollbar max-h-[360px] flex-1 overflow-y-auto p-4">
                {remediationHistory.length === 0 ? (
                  <p className="p-2 text-sm text-slate-500">
                    No remediation commands yet. Queued actions and their outcomes appear here.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {remediationHistory.map((cmd) => (
                      <li key={cmd.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <span className="w-12 shrink-0 text-xs tabular-nums text-slate-500">
                          {new Date(cmd.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-300">{cmd.action}</p>
                          <p className="truncate text-xs text-slate-500">{cmd.hostname}</p>
                        </div>
                        <Badge
                          tone={cmd.status === "DONE" ? "success" : cmd.status === "FAILED" ? "critical" : "neutral"}
                        >
                          {cmd.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          </div>

        <div className="mb-6">
          <Panel className="overflow-visible">
            <PanelHeader title="All devices" />
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
                    <TH align="right">Actions</TH>
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
        </div>

        {/* Onboarding is prominent only until the first device is enrolled. */}
        {summary.total === 0 ? (
          <EnrollDevicePanel />
        ) : (
          <CollapsibleSection title="Enroll a device" subtitle="Add a laptop to this tenant">
            <EnrollDevicePanel />
          </CollapsibleSection>
        )}

        </TabPanel>
      )}

      {tab === "performance" && (
        <TabPanel id="performance" tabsId={tabsId}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Panel padded className="lg:col-span-2 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Radio className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latency (ms)</h2>
              {latency && latency.samples > 0 && (
                <span className="ml-auto text-xs text-slate-500 tabular-nums">
                  p95 {latency.p95}ms · median {latency.median}ms · {latency.samples.toLocaleString()} samples
                </span>
              )}
            </div>
            <div className="flex-1 min-h-[300px]">
              {/* An empty chart is drawn as an empty state rather than a flat line
                  at zero. The previous version rendered seven hardcoded points
                  under a "Live agent data" badge whatever the fleet was doing. */}
              {latencyData.length === 0 ? (
                <div className="flex h-full min-h-[300px] items-center justify-center text-center">
                  <p className="max-w-xs text-sm text-slate-500">
                    No latency telemetry in the last 12 hours. Enrolled agents report every 30 seconds.
                  </p>
                </div>
              ) : (
              mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="time" stroke={axisColor} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px" }}
                    itemStyle={{ color: tooltipText }}
                  />
                  <Line type="monotone" dataKey="ms" stroke="#38E8B0" strokeWidth={3} dot={{ r: 4, fill: "#38E8B0", strokeWidth: 0 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
              )
              )}
            </div>
          </Panel>

          <Panel padded className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health</h2>
              </div>
              {isAutoPilotOn && <Badge tone="success" dot>Auto-Healing Active</Badge>}
            </div>
            <div className="flex-1 min-h-[220px]">
              {deviceHealthData.length === 0 || fleetHealth?.total === 0 ? (
                <div className="flex h-full min-h-[220px] items-center justify-center text-center">
                  <p className="max-w-xs text-sm text-slate-500">No devices enrolled yet.</p>
                </div>
              ) : (
              mounted && (
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
              )
              )}
            </div>
          
            <div className="mt-4 pt-4 border-t border-white/10">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400 font-medium">Remediations completed today</span>
                 <span className="font-semibold text-emerald-400 text-lg tabular-nums">{remediation?.completedToday ?? 0}</span>
               </div>
               {(remediation?.failedToday ?? 0) > 0 && (
                 <div className="flex justify-between items-center text-xs mt-1">
                   <span className="text-slate-500">Failed today</span>
                   <span className="font-semibold text-rose-400 tabular-nums">{remediation?.failedToday}</span>
                 </div>
               )}
               <div className="flex justify-between items-center text-xs mt-1">
                 {/* Labelled an estimate, and weighted per action type — the old
                     figure was a client-side counter multiplied by a flat 15. */}
                 <span className="text-slate-500">Est. admin time saved</span>
                 <span className="font-semibold text-slate-300 tabular-nums">{remediation?.minutesSavedToday ?? 0} mins</span>
               </div>
            </div>
          </Panel>
        </div>

        {/* Boot and login time.
            `BootProfile` has been written on every agent boot since the agent
            shipped and read by nothing. Boot time is among the most-requested DEX
            metrics in the market and one an executive actually feels, so this is
            the cheapest real value available: the collection already works. */}
        <Panel className="overflow-hidden">
          <PanelHeader title="Startup" icon={Power} />
          {!boot || boot.devicesReporting === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No boot profiles reported yet. The agent records one on each startup, so this fills in as
              devices reboot.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 p-6 md:grid-cols-4">
                <StatTile
                  label="Median boot"
                  value={boot.medianBootSec != null ? `${boot.medianBootSec.toFixed(0)}s` : "—"}
                  hint={`${boot.devicesReporting} devices`}
                  tone={boot.medianBootSec != null && boot.medianBootSec > 90 ? "warning" : "neutral"}
                />
                <StatTile
                  label="p95 boot"
                  value={boot.p95BootSec != null ? `${boot.p95BootSec.toFixed(0)}s` : "—"}
                  hint="Slowest 5%"
                  tone={boot.p95BootSec != null && boot.p95BootSec > 120 ? "warning" : "neutral"}
                />
                <StatTile
                  label="Median sign-in"
                  value={boot.medianLoginSec != null ? `${boot.medianLoginSec.toFixed(0)}s` : "—"}
                  hint="Logon to usable desktop"
                />
                <StatTile label="Boots measured" value={boot.samples} hint="Last 500" />
              </div>

              <div className="overflow-x-auto">
                <DataTable>
                  <THead>
                    <TR>
                      <TH>Device</TH>
                      <TH>User</TH>
                      <TH>Total</TH>
                      <TH>BIOS</TH>
                      <TH>OS</TH>
                      <TH>Sign-in</TH>
                      <TH>GPO</TH>
                      <TH>Measured</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {boot.slowest.map((b) => (
                      <TR key={b.id}>
                        <TD className="font-medium text-slate-200">{b.hostname}</TD>
                        <TD className="text-slate-400">{b.user}</TD>
                        <TD>
                          <Badge
                            tone={b.band === "good" ? "success" : b.band === "slow" ? "warning" : "critical"}
                          >
                            {b.totalSec}s
                          </Badge>
                        </TD>
                        <TD className="tabular-nums text-slate-400">{b.biosSec != null ? `${b.biosSec}s` : "—"}</TD>
                        <TD className="tabular-nums text-slate-400">{b.osBootSec != null ? `${b.osBootSec}s` : "—"}</TD>
                        <TD className="tabular-nums text-slate-400">{b.loginSec != null ? `${b.loginSec}s` : "—"}</TD>
                        <TD className="tabular-nums text-slate-400">{b.gpoSec != null ? `${b.gpoSec}s` : "—"}</TD>
                        <TD className="text-slate-500">{new Date(b.at).toLocaleString()}</TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </div>
            </>
          )}
        </Panel>
    

        {/* Network quality.
            `packetLossPct` and `wifiSignalDbm` arrive on every metrics POST and
            were displayed nowhere. Aggregated over 24h per device rather than
            shown as a last-sample snapshot, because intermittent loss is the
            interesting case and one good sample would hide it. */}
        <Panel className="overflow-hidden">
          <PanelHeader title="Connectivity" icon={Radio} />
          {!network || network.devicesReporting === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No network telemetry reported yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 p-6 md:grid-cols-4">
                <StatTile
                  label="Median packet loss"
                  value={
                    network.medianPacketLossPct != null ? `${network.medianPacketLossPct.toFixed(2)}%` : "—"
                  }
                />
                <StatTile
                  label="Median WiFi signal"
                  value={
                    network.medianWifiSignalDbm != null ? `${network.medianWifiSignalDbm.toFixed(0)} dBm` : "—"
                  }
                />
                <StatTile
                  label="Poor connectivity"
                  value={network.poorConnectivityCount}
                  tone={network.poorConnectivityCount > 0 ? "warning" : "neutral"}
                  hint="Devices"
                />
                <StatTile label="Devices reporting" value={network.devicesReporting} />
              </div>

              <div className="overflow-x-auto">
                <DataTable>
                  <THead>
                    <TR>
                      <TH>Device</TH>
                      <TH>User</TH>
                      <TH>SSID</TH>
                      <TH>Packet loss</TH>
                      <TH>Worst</TH>
                      <TH>WiFi signal</TH>
                      <TH>p95 latency</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {network.worst.map((d) => (
                      <TR key={d.deviceId}>
                        <TD className="font-medium text-slate-200">{d.hostname}</TD>
                        <TD className="text-slate-400">{d.user}</TD>
                        <TD className="text-slate-400">{d.ssid ?? "Wired / unknown"}</TD>
                        <TD>
                          {d.packetLossPct == null ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <Badge
                              tone={
                                d.lossBand === "good" ? "success" : d.lossBand === "fair" ? "warning" : "critical"
                              }
                            >
                              {d.packetLossPct.toFixed(2)}%
                            </Badge>
                          )}
                        </TD>
                        <TD className="tabular-nums text-slate-400">
                          {d.worstPacketLossPct != null ? `${d.worstPacketLossPct.toFixed(1)}%` : "—"}
                        </TD>
                        <TD>
                          {d.wifiSignalDbm == null ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <Badge
                              tone={
                                d.signalBand === "good"
                                  ? "success"
                                  : d.signalBand === "fair"
                                    ? "warning"
                                    : "critical"
                              }
                            >
                              {d.wifiSignalDbm.toFixed(0)} dBm
                            </Badge>
                          )}
                        </TD>
                        <TD className="tabular-nums text-slate-400">
                          {d.p95LatencyMs != null ? `${d.p95LatencyMs}ms` : "—"}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </div>
            </>
          )}
        </Panel>
    
        </TabPanel>
      )}

      {tab === "reliability" && (
        <TabPanel id="reliability" tabsId={tabsId}>
      <Panel className="overflow-hidden">
        <PanelHeader title="Application crashes" icon={Activity} />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Most crashes</h3>
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
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent events</h3>
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
    

        {/* Employee sentiment.
            `MicroSurveyResponse` was the other model with a write site and no read
            site. These 1-5 ratings are captured right after a bad event, which
            makes them the only direct signal in the product about how the fleet
            actually feels to use — as opposed to what its counters say. */}
        <Panel className="overflow-hidden">
          <PanelHeader title="Employee sentiment" icon={Activity} />
          {!sentiment || sentiment.responses === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No survey responses yet. The agent prompts for a rating after events such as an application
              crash.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 p-6 md:grid-cols-3">
                <StatTile
                  label="Average rating"
                  value={sentiment.averageRating != null ? `${sentiment.averageRating.toFixed(1)} / 5` : "—"}
                  tone={
                    sentiment.averageRating != null && sentiment.averageRating < 3 ? "warning" : "neutral"
                  }
                />
                <StatTile
                  label="Detractors"
                  value={sentiment.detractorPct != null ? `${sentiment.detractorPct.toFixed(0)}%` : "—"}
                  hint="Rated 1-2"
                  tone={sentiment.detractorPct != null && sentiment.detractorPct > 25 ? "warning" : "neutral"}
                />
                <StatTile label="Responses" value={sentiment.responses} />
              </div>

              <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Worst-rated triggers
                  </h3>
                  <div className="space-y-2">
                    {sentiment.byTrigger.map((t) => (
                      <div
                        key={t.trigger}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                      >
                        <span className="min-w-0 truncate text-sm text-slate-300">{t.trigger}</span>
                        <span className="ml-3 shrink-0 text-sm tabular-nums text-slate-400">
                          {t.averageRating.toFixed(1)} / 5
                          <span className="ml-2 text-xs text-slate-500">({t.responses})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recent comments
                  </h3>
                  {sentiment.recentComments.length === 0 ? (
                    <p className="text-sm text-slate-500">No written comments yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {sentiment.recentComments.map((c, i) => (
                        <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge tone={c.rating <= 2 ? "critical" : c.rating >= 4 ? "success" : "warning"}>
                              {c.rating} / 5
                            </Badge>
                            <span className="text-xs text-slate-500">{c.hostname}</span>
                          </div>
                          <p className="text-sm text-slate-300">{c.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>
    

        <Panel padded>
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Failure predictions</h2>
              <p className="text-slate-400 text-sm mt-1">Projected from each device&rsquo;s own telemetry trend, not fixed rules.</p>

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
                  arbitrageData.slice(0, 4).map((a, i) => {
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

        </TabPanel>
      )}

      {tab === "automation" && (
        <TabPanel id="automation" tabsId={tabsId}>
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
              smartContracts.map((sc) => (
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
              burnoutRisks.map((risk, i) => (
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
    

      <Panel className="overflow-hidden">
        <PanelHeader title="Security &amp; campaigns" icon={BrainCircuit} />
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
    

        <FleetCopilot />
    
        </TabPanel>
      )}

      {tab === "cost" && (
        <TabPanel id="cost" tabsId={tabsId}>
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
                shadowIt.unusedLicenses.map((lic, i) => (
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
                arbitrageData.map((a, i) => (
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
    
        </TabPanel>
      )}

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
      {isFleetActionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Panel className="p-6 w-full max-w-lg bg-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-slate-400" />
              Fleet-Wide Remediation
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Queue one runbook action on <strong>ALL</strong> enrolled devices. Only these named actions
              are supported — the agent will refuse anything outside its built-in vocabulary.
            </p>

            <div className="space-y-4 mb-6">
              <Field label="Action">
                <Select
                  value={fleetAction}
                  onChange={(e) => setFleetAction(e.target.value)}
                  disabled={isDeployingFleetAction}
                >
                  <option value="CLEAR_TEMP">Clear temp files</option>
                  <option value="FLUSH_DNS">Flush DNS cache</option>
                  <option value="RESTART_SPOOLER">Restart print spooler</option>
                  <option value="REBOOT">Reboot (60s warning)</option>
                </Select>
              </Field>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsFleetActionModalOpen(false)}
                disabled={isDeployingFleetAction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeployFleetAction}
                disabled={isDeployingFleetAction}
                loading={isDeployingFleetAction}
              >
                {isDeployingFleetAction ? "Queueing..." : "Queue on all devices"}
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
