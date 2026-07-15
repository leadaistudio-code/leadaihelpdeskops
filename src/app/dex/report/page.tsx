"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDexReportData } from "@/app/actions/reportActions";
import { Activity, ShieldAlert, Cpu, AlertTriangle, Printer, Zap } from "lucide-react";
import { useAppTheme } from "@/components/ThemeContext";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || 'weekly';
  const { theme } = useAppTheme();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDexReportData(period).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [period]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Generating Report...</div>;
  }

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 print:bg-white print:text-black">
      {/* Hide this print button when printing */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-end print:hidden">
        <button
          onClick={printReport}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <Printer className="w-4 h-4" /> Save as PDF / Print
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg">LAI</div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lead AI Solution</h1>
            </div>
            <h2 className="text-xl text-slate-500 font-medium">Digital Employee Experience Report</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Period</div>
            <div className="text-lg font-bold capitalize text-slate-800">{period} Report</div>
            <div className="text-sm text-slate-500 mt-1">Generated: {new Date(data.generatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Fleet Health Summary */}
        <div className="mb-10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
            <Activity className="w-5 h-5 text-slate-500" /> Fleet Health Overview
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-1">Avg CPU Usage</div>
              <div className="text-2xl font-bold text-slate-700 tabular-nums">{data.fleetHealth.avgCpu}%</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-1">Avg RAM Usage</div>
              <div className="text-2xl font-bold text-slate-700 tabular-nums">{data.fleetHealth.avgMemPct}%</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-1">Avg Latency</div>
              <div className="text-2xl font-bold text-slate-700 tabular-nums">{data.fleetHealth.avgLatency}ms</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-1">Total Samples</div>
              <div className="text-2xl font-bold text-slate-700 tabular-nums">{data.fleetHealth.samples}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* App Stability */}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Application Stability
            </h3>
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
              <div className="mb-4">
                <span className="text-3xl font-bold text-amber-700 tabular-nums">{data.stability.totalCrashes}</span>
                <span className="text-sm font-medium text-amber-600 ml-2">total crashes recorded</span>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase font-bold text-amber-800/60 mb-2">Top Crashing Apps</div>
                {data.stability.topCrashes.length === 0 ? (
                  <div className="text-sm text-amber-700/60 italic">No crashes recorded in this period.</div>
                ) : (
                  data.stability.topCrashes.map(([app, count]: [string, number], i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm font-medium text-amber-900 border-b border-amber-200/50 pb-2 last:border-0 last:pb-0">
                      <span>{app}</span>
                      <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Security Posture Drift */}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Security Posture Drift
            </h3>
            <div className="p-5 bg-rose-50 rounded-xl border border-rose-100">
              <div className="mb-4">
                <span className="text-3xl font-bold text-rose-700 tabular-nums">{data.security.driftingDevices}</span>
                <span className="text-sm font-medium text-rose-600 ml-2">devices with security drift</span>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase font-bold text-rose-800/60 mb-2">Affected Endpoints</div>
                {data.security.drifts.length === 0 ? (
                  <div className="text-sm text-rose-700/60 italic">All devices compliant.</div>
                ) : (
                  data.security.drifts.slice(0, 5).map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm font-medium text-rose-900 border-b border-rose-200/50 pb-2 last:border-0 last:pb-0">
                      <span>{d.hostname}</span>
                      <div className="flex gap-2">
                        {!d.bitlocker && <span className="bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold">BitLocker OFF</span>}
                        {!d.firewall && <span className="bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold">Firewall OFF</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Lifecycle Arbitrage */}
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
            <Zap className="w-5 h-5 text-emerald-500" /> Hardware Lifecycle Arbitrage
          </h3>
          <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-sm font-medium text-emerald-700 mb-1">Total Value at Risk</div>
                <div className="text-4xl font-bold text-emerald-600 tabular-nums">${data.hardware.totalValueAtRisk}</div>
              </div>
              <div className="text-right text-sm text-emerald-800/70 max-w-xs">
                Potential loss in refurbished resale value if predicted failures occur before devices are sold.
              </div>
            </div>
            
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-200 text-emerald-800/60 uppercase tracking-wider text-xs">
                  <th className="pb-2 font-bold">Device Hostname</th>
                  <th className="pb-2 font-bold">Predicted Failure</th>
                  <th className="pb-2 font-bold text-right">Value at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/50">
                {data.hardware.alerts.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-emerald-700/60 italic text-center">No active hardware failure predictions.</td></tr>
                ) : (
                  data.hardware.alerts.map((a: any, i: number) => (
                    <tr key={i} className="text-emerald-900 font-medium">
                      <td className="py-3">{a.device}</td>
                      <td className="py-3 text-rose-600">{a.component}</td>
                      <td className="py-3 text-right font-bold">${a.valueAtRisk}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 font-medium uppercase tracking-wider">
          Lead AI Studio &bull; Enterprise AIOps Reporting
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
