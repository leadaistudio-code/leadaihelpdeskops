import { getShadowItSavings } from "@/app/actions/dexActions";
import AnalyticsClient from "./AnalyticsClient";
import { DollarSign, ShieldAlert } from "lucide-react";
import { PageHeader, StatTile } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getShadowItSavings();
  const totalWasted = data.totalSavings;
  const zombieCount = data.unusedLicenses.length;

  // Calculate top wasted app
  const appTotals: Record<string, number> = {};
  for (const lic of data.unusedLicenses) {
    appTotals[lic.software] = (appTotals[lic.software] || 0) + lic.cost;
  }
  let topApp = "None";
  let topAppCost = 0;
  for (const [app, cost] of Object.entries(appTotals)) {
    if (cost > topAppCost) {
      topAppCost = cost;
      topApp = app;
    }
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Shadow IT Cost-Killer"
        description="Identify and automatically revoke unused SaaS licenses."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatTile
          label="Total Wasted Spend"
          value={
            <>
              ${totalWasted}
              <span className="text-base font-normal text-slate-500"> /mo</span>
            </>
          }
          icon={DollarSign}
          tone="critical"
          hint="Wasting budget"
        />
        <StatTile
          label="Zombie Licenses"
          value={
            <>
              {zombieCount}
              <span className="text-base font-normal text-slate-500"> found</span>
            </>
          }
          icon={ShieldAlert}
          tone="warning"
          hint=">30 days inactive"
        />
        <StatTile
          label="Top Wasting App"
          value={<span className="truncate block">{topApp.replace(".exe", "")}</span>}
          icon={DollarSign}
          tone="neutral"
          hint={`$${topAppCost}/mo wasted`}
        />
      </div>

      <AnalyticsClient initialData={data.unusedLicenses} activeData={data.activeLicenses} />
    </div>
  );
}
