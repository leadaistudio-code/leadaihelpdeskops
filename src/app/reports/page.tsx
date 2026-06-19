"use client";

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { BarChart3, TrendingDown, TrendingUp, Target, Clock, ShieldAlert, FileText, Download, Plus, LayoutDashboard, X, Settings2 } from "lucide-react";

export default function PerformanceDashboards() {
  const [timeRange, setTimeRange] = useState("30d");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Mock aggregated metrics - datasets mapped by time range
  const mockDataSets: any = {
    '7d': {
      mttr: 3.5, sla: 94.2, backlog: 142, csat: 4.8,
      volumeData: [
        { date: 'Mon', incidents: 45, requests: 30, changes: 5 },
        { date: 'Tue', incidents: 52, requests: 35, changes: 8 },
        { date: 'Wed', incidents: 38, requests: 42, changes: 3 },
        { date: 'Thu', incidents: 65, requests: 28, changes: 12 },
        { date: 'Fri', incidents: 48, requests: 50, changes: 9 },
        { date: 'Sat', incidents: 15, requests: 10, changes: 2 },
        { date: 'Sun', incidents: 12, requests: 5, changes: 1 },
      ],
      mttrData: [
        { date: 'Mon', hours: 4.2 }, { date: 'Tue', hours: 3.8 }, { date: 'Wed', hours: 4.5 },
        { date: 'Thu', hours: 5.1 }, { date: 'Fri', hours: 3.2 }, { date: 'Sat', hours: 2.1 }, { date: 'Sun', hours: 1.8 }
      ],
      backlogGrowth: [
        { week: 'Mon', open: 140, closed: 130 }, { week: 'Wed', open: 145, closed: 135 },
        { week: 'Fri', open: 142, closed: 150 }, { week: 'Sun', open: 142, closed: 142 }
      ],
      firstContactResolution: [
        { name: 'Tier 1', FCR: 78, Target: 80 }, { name: 'Tier 2', FCR: 42, Target: 50 }, { name: 'Tier 3', FCR: 22, Target: 25 },
      ]
    },
    '30d': {
      mttr: 4.1, sla: 91.5, backlog: 180, csat: 4.6,
      volumeData: [
        { date: 'W1', incidents: 250, requests: 180, changes: 30 },
        { date: 'W2', incidents: 280, requests: 190, changes: 45 },
        { date: 'W3', incidents: 220, requests: 210, changes: 25 },
        { date: 'W4', incidents: 310, requests: 170, changes: 50 },
      ],
      mttrData: [
        { date: 'W1', hours: 4.5 }, { date: 'W2', hours: 4.0 },
        { date: 'W3', hours: 4.2 }, { date: 'W4', hours: 3.8 }
      ],
      backlogGrowth: [
        { week: 'W1', open: 120, closed: 110 }, { week: 'W2', open: 135, closed: 140 },
        { week: 'W3', open: 150, closed: 130 }, { week: 'W4', open: 180, closed: 160 },
      ],
      firstContactResolution: [
        { name: 'Tier 1', FCR: 75, Target: 80 }, { name: 'Tier 2', FCR: 45, Target: 50 }, { name: 'Tier 3', FCR: 20, Target: 25 },
      ]
    },
    'ytd': {
      mttr: 4.8, sla: 88.9, backlog: 240, csat: 4.4,
      volumeData: [
        { date: 'Jan', incidents: 1200, requests: 800, changes: 150 },
        { date: 'Feb', incidents: 1150, requests: 850, changes: 160 },
        { date: 'Mar', incidents: 1300, requests: 900, changes: 140 },
        { date: 'Apr', incidents: 1400, requests: 820, changes: 180 },
        { date: 'May', incidents: 1250, requests: 880, changes: 170 },
        { date: 'Jun', incidents: 800, requests: 500, changes: 90 },
      ],
      mttrData: [
        { date: 'Jan', hours: 5.2 }, { date: 'Feb', hours: 5.0 }, { date: 'Mar', hours: 4.8 },
        { date: 'Apr', hours: 4.5 }, { date: 'May', hours: 4.1 }, { date: 'Jun', hours: 3.8 }
      ],
      backlogGrowth: [
        { week: 'Jan', open: 800, closed: 750 }, { week: 'Feb', open: 850, closed: 800 },
        { week: 'Mar', open: 900, closed: 880 }, { week: 'Apr', open: 950, closed: 960 },
        { week: 'May', open: 980, closed: 1000 }, { week: 'Jun', open: 1020, closed: 980 },
      ],
      firstContactResolution: [
        { name: 'Tier 1', FCR: 70, Target: 80 }, { name: 'Tier 2', FCR: 40, Target: 50 }, { name: 'Tier 3', FCR: 18, Target: 25 },
      ]
    }
  };

  const currentData = mockDataSets[timeRange];

  const slaAdherenceData = [
    { category: 'P1 Critical', met: 98, breached: 2 },
    { category: 'P2 High', met: 94, breached: 6 },
    { category: 'P3 Medium', met: 85, breached: 15 },
    { category: 'P4 Low', met: 72, breached: 28 },
  ];

  const categoryDeflectionData = [
    { name: 'Password Reset', value: 400 },
    { name: 'VPN Access', value: 300 },
    { name: 'Software Install', value: 300 },
    { name: 'Hardware', value: 200 },
  ];
  const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24'];

  const activeAssetsHealth = [
    { name: 'Healthy', value: 85 },
    { name: 'At Risk', value: 10 },
    { name: 'Critical', value: 5 },
  ];
  const ASSET_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10 space-y-8">
      
      {/* Report Builder Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl glass-panel border border-white/10 rounded-2xl shadow-2xl flex flex-col bg-slate-900/95">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create New Report</h3>
                  <p className="text-xs text-slate-400">Configure your custom data visualization</p>
                </div>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Source (Table)</label>
                  <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                    <option>Incident [incident]</option>
                    <option>Request [sc_request]</option>
                    <option>Change [change_request]</option>
                    <option>Hardware [alm_hardware]</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                    <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                      <option>Bar Chart</option>
                      <option>Time Series</option>
                      <option>Pie Chart</option>
                      <option>Single Score</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Group By</label>
                    <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                      <option>Priority</option>
                      <option>State</option>
                      <option>Assigned To</option>
                      <option>Category</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end space-x-3 bg-black/20 rounded-b-2xl">
              <button onClick={() => setIsReportModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={() => setIsReportModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors flex items-center space-x-2">
                <Settings2 className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/5 shadow-lg">
            <LayoutDashboard className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Performance Dashboards</h1>
            <p className="text-slate-400 mt-1 font-medium">Executive Summary & Operational Analytics</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900/50 rounded-xl p-1 border border-white/5">
            <button onClick={() => setTimeRange("7d")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${timeRange === '7d' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>7 Days</button>
            <button onClick={() => setTimeRange("30d")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${timeRange === '30d' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>30 Days</button>
            <button onClick={() => setTimeRange("ytd")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${timeRange === 'ytd' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>YTD</button>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl transition-colors font-bold text-sm">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button onClick={() => setIsReportModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-colors font-bold text-sm">
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards - Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24 text-indigo-500" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Overall MTTR</p>
          <div className="flex items-end space-x-2 mb-2">
            <span className="text-5xl font-black text-white tracking-tighter">{currentData.mttr}</span>
            <span className="text-slate-400 mb-1.5 font-bold">Hrs</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <TrendingDown className="w-3 h-3" />
            <span>Improved vs last period</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-24 h-24 text-emerald-500" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">SLA Adherence</p>
          <div className="flex items-end space-x-2 mb-2">
            <span className="text-5xl font-black text-white tracking-tighter">{currentData.sla}</span>
            <span className="text-slate-400 mb-1.5 font-bold">%</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" />
            <span>Stable vs last period</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-24 h-24 text-amber-500" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Active Backlog</p>
          <div className="flex items-end space-x-2 mb-2">
            <span className="text-5xl font-black text-white tracking-tighter">{currentData.backlog}</span>
            <span className="text-slate-400 mb-1.5 font-bold">Tickets</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 bg-rose-400/10 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" />
            <span>Rising volume</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 className="w-24 h-24 text-sky-500" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">CSAT Score</p>
          <div className="flex items-end space-x-2 mb-2">
            <span className="text-5xl font-black text-white tracking-tighter">{currentData.csat}</span>
            <span className="text-slate-400 mb-1.5 font-bold">/ 5.0</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" />
            <span>Excellent rating</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. Ticket Volume Area Chart */}
        <div className="glass-panel rounded-3xl p-6 xl:col-span-2 border border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Incoming Volume (Incidents vs Requests vs Changes)</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e879f9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#e879f9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="incidents" stackId="1" stroke="#818cf8" fillOpacity={1} fill="url(#colorInc)" strokeWidth={2} />
                <Area type="monotone" dataKey="requests" stackId="1" stroke="#e879f9" fillOpacity={1} fill="url(#colorReq)" strokeWidth={2} />
                <Area type="monotone" dataKey="changes" stackId="1" stroke="#34d399" fillOpacity={1} fill="url(#colorChg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Knowledge Base Deflection (Pie Chart) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">KB Deflection by Category</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDeflectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryDeflectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryDeflectionData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs text-slate-300 font-bold">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SLA Adherence Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 xl:col-span-2 border border-white/10 flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">SLA Adherence by Priority</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaAdherenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                <Bar dataKey="met" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="breached" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. MTTR Line Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">MTTR Trend (Hours)</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData.mttrData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. First Contact Resolution (Radar) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">First Contact Resolution %</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={currentData.firstContactResolution}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)' }} />
                <Radar name="Achieved FCR" dataKey="FCR" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
                <Radar name="Target FCR" dataKey="Target" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Backlog Growth (Composed Chart) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">Backlog Growth vs Closed</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentData.backlogGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="open" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Active Assets Health (Donut) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">Active Hardware Health</h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeAssetsHealth}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {activeAssetsHealth.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-3xl font-black text-white">85%</span>
              <span className="text-xs font-bold text-slate-400">Healthy</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
