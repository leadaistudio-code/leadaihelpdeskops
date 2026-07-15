"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3, Target, Clock, FileText, CheckCircle2, Inbox } from "lucide-react";
import type { ReportMetrics } from "@/app/actions/reportActions";
import { useAppTheme } from "@/components/ThemeContext";
import { PageHeader, StatTile, Panel, PanelHeader, Badge, cn } from "@/components/ui";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#38bdf8", IN_PROGRESS: "#fbbf24", ON_HOLD: "#a78bfa",
  PENDING_APPROVAL: "#f472b6", RESOLVED: "#34d399", CLOSED: "#64748b",
};
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#f43f5e", HIGH: "#fb923c", MEDIUM: "#fbbf24", LOW: "#64748b",
};
const ASSET_COLORS: Record<string, string> = {
  IN_USE: "#38bdf8", IN_STOCK: "#34d399", RETIRED: "#64748b", MISSING: "#f43f5e",
};

type TooltipEntry = { name?: string; value?: number | string; color?: string; payload?: { fill?: string } };

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
        {label && <p className="text-white font-bold mb-2">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.payload?.fill }} className="text-sm font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function ChartCard({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <Panel className={cn("flex flex-col", wide && "xl:col-span-2")}>
      <PanelHeader title={title} />
      <div className="flex-1 min-h-[280px] p-6">{children}</div>
    </Panel>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center">
      <Inbox className="w-10 h-10 text-slate-600 mb-3" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function ReportsView({ data }: { data: ReportMetrics }) {
  const hasVolume = data.volumeByDay.some((d) => d.incidents > 0 || d.requests > 0);
  const { theme } = useAppTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.3)";
  const gridColor = isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.05)";

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10 space-y-8">
      {/* Header */}
      <PageHeader
        className="mb-0"
        title="Performance Dashboards"
        description="Live operational analytics from your service desk"
        action={<Badge tone="success" dot>Live data</Badge>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatTile icon={Clock} label="Mean Time to Resolution" value={<>{data.mttrHours}<span className="text-base font-normal text-slate-500"> Hrs</span></>} />
        <StatTile icon={Target} label="SLA Adherence" value={<>{data.slaAdherence}<span className="text-base font-normal text-slate-500"> %</span></>} />
        <StatTile icon={FileText} label="Active Backlog" value={<>{data.backlog}<span className="text-base font-normal text-slate-500"> Open</span></>} />
        <StatTile icon={BarChart3} label="Total Incidents" value={data.totalIncidents} hint={`${data.resolvedCount} resolved`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Volume */}
        <ChartCard title="Ticket Volume (Last 14 Days)" wide>
          {hasVolume ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.volumeByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={axisColor} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={axisColor} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="incidents" stackId="1" stroke="#818cf8" fill="url(#cInc)" strokeWidth={2} />
                <Area type="monotone" dataKey="requests" stackId="1" stroke="#34d399" fill="url(#cReq)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No tickets created in the last 14 days yet." />
          )}
        </ChartCard>

        {/* Status breakdown */}
        <ChartCard title="Incidents by Status">
          {data.statusBreakdown.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                  {data.statusBreakdown.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? "#64748b"} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="No incidents yet." />}
        </ChartCard>

        {/* SLA by priority */}
        <ChartCard title="SLA Adherence by Priority" wide>
          {data.resolvedCount ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slaByPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="category" stroke={axisColor} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={axisColor} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: gridColor }} content={<CustomTooltip />} />
                <Bar dataKey="met" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="breached" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="No resolved incidents to measure against SLA yet." />}
        </ChartCard>

        {/* Priority breakdown */}
        <ChartCard title="Incidents by Priority">
          {data.priorityBreakdown.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priorityBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={axisColor} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke={axisColor} tickLine={false} axisLine={false} fontSize={12} width={80} />
                <Tooltip cursor={{ fill: gridColor }} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.priorityBreakdown.map((e) => <Cell key={e.name} fill={PRIORITY_COLORS[e.name] ?? "#64748b"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="No incidents yet." />}
        </ChartCard>

        {/* Asset health */}
        <ChartCard title="Asset Health">
          {data.assetHealth.length ? (
            <div className="h-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.assetHealth} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                    {data.assetHealth.map((e) => <Cell key={e.name} fill={ASSET_COLORS[e.name] ?? "#64748b"} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-3xl font-semibold text-white tabular-nums">{data.assetHealth.reduce((a, b) => a + b.value, 0)}</span>
                <span className="text-xs font-semibold text-slate-400">Total Assets</span>
              </div>
            </div>
          ) : <EmptyChart label="No assets registered yet." />}
        </ChartCard>
      </div>

      {/* Legend / footnote */}
      <Panel className="p-5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400 leading-relaxed">
          All figures are computed live from your incidents and assets. SLA adherence uses your configured SLA
          definitions where available, falling back to standard targets (Critical 4h · High 8h · Medium 24h · Low 72h).
        </p>
      </Panel>
    </div>
  );
}
