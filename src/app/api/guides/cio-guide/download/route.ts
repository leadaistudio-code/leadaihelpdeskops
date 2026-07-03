import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { buildCioGuidePdf } from "@/lib/cio-guide-pdf";
import { CIO_GUIDE_SLUG } from "@/lib/guides";

// pdfkit reads its bundled font-metric files from disk, so this must run on the
// Node.js runtime (not edge). It's also inherently dynamic (per-lead PDF).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/guides/cio-guide/download?lead=<leadId>
// Streams the personalised 24-page guide, but only to someone who has been
// issued a valid lead id by the capture form — that's the gate.
export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get("lead");
  if (!leadId) {
    return new Response("Missing lead token.", { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, name: true, company: true, jobTitle: true, guide: true },
  });

  if (!lead || lead.guide !== CIO_GUIDE_SLUG) {
    return new Response("This download link is not valid.", { status: 403 });
  }

  const pdf = await buildCioGuidePdf({
    name: lead.name,
    company: lead.company,
    jobTitle: lead.jobTitle,
  });

  // Mark the lead as having downloaded (best-effort; never block the download).
  prisma.lead
    .update({ where: { id: lead.id }, data: { downloaded: true } })
    .catch((e) => console.error("mark lead downloaded failed:", e));

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="The-CIOs-Guide-to-Autonomous-IT-Operations.pdf"',
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
