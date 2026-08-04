import { NextResponse } from "next/server";

// Retired: agent-reported hardware "predictions".
//
// This route accepted `{ component, probability, status }` from the endpoint and
// wrote it straight into `HardwareFailurePrediction`. The probabilities were
// invented on the agent — 0.05 if a SMART string said "Healthy", 0.8 if it did
// not — and landed in the same table as the real ones.
//
// Real predictions come from `src/lib/hardware-prediction.ts`: least-squares
// regression over the actual `DeviceMetric` series, which publishes slope, r²,
// sample count and days-to-threshold with every output and refuses to emit
// anything at all below `MIN_SAMPLES`. That explainability is the product's
// genuine differentiator, and it is worth nothing if a fabricated row can sit
// next to a derived one indistinguishably.
//
// The route is kept (rather than deleted) and fails closed, because the agent
// cannot yet self-update: binaries already installed on customer laptops will
// keep POSTing here for as long as they are deployed. Deleting the file would
// give them a 404 they ignore; returning 410 documents the decision at the only
// place that can actually enforce it. Remove this once no agent in the field
// predates the change.

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Endpoint retired. Hardware failure predictions are derived server-side from device metrics; agents must not report predictions.",
    },
    { status: 410 }
  );
}
