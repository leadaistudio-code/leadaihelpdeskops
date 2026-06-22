import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { getActiveDomain } from "@/lib/tenant";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// Block executable/script types; allow everything else (images, pdf, docs, logs…).
const BLOCKED = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-executable",
  "application/vnd.microsoft.portable-executable",
]);

export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "upload"), 30, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const form = await req.formData();
    const incidentId = form.get("incidentId");
    const articleId = form.get("articleId");
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }
    // Exactly one parent target is required.
    const targetIncident = typeof incidentId === "string" && incidentId ? incidentId : null;
    const targetArticle = typeof articleId === "string" && articleId ? articleId : null;
    if (!targetIncident && !targetArticle) {
      return NextResponse.json({ error: "Missing incidentId or articleId." }, { status: 400 });
    }
    if (file.size === 0) return NextResponse.json({ error: "Empty file." }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds the 5MB limit." }, { status: 413 });
    }
    if (BLOCKED.has(file.type)) {
      return NextResponse.json({ error: "That file type isn't allowed." }, { status: 415 });
    }

    const domain = await getActiveDomain();
    if (targetIncident) {
      const exists = await prisma.incident.findFirst({ where: { id: targetIncident, domain }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    } else if (targetArticle) {
      const exists = await prisma.knowledgeArticle.findFirst({ where: { id: targetArticle, domain }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const att = await prisma.attachment.create({
      data: {
        incidentId: targetIncident,
        articleId: targetArticle,
        filename: file.name.slice(0, 255),
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data: bytes,
        uploadedById: user.id,
      },
      select: { id: true, filename: true, mimeType: true, size: true },
    });

    revalidatePath(targetIncident ? `/incidents/${targetIncident}` : `/knowledge/${targetArticle}`);
    return NextResponse.json({ attachment: att });
  } catch (error) {
    logError(error, { route: "POST /api/attachments" });
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
