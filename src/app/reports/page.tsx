export const dynamic = "force-dynamic";

import { getReportMetrics } from "@/app/actions/reportActions";
import ReportsView from "@/components/ReportsView";

export default async function PerformanceDashboards() {
  const metrics = await getReportMetrics();
  return <ReportsView data={metrics} />;
}
