import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { attachmentVisibleTo } from "@/lib/attachment-access";
import { logError } from "@/lib/observability";

// Stream a stored attachment back to the browser. Images/PDFs render inline;
// other types download.
//
// Attachment carries no `domain` of its own — it is reachable only through the
// incident or article that owns it, so visibility is derived from that parent.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await ctx.params;
    const att = await prisma.attachment.findFirst({
      where: { id, ...attachmentVisibleTo(user, await getActiveDomain()) },
    });
    if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const inline = att.mimeType.startsWith("image/") || att.mimeType === "application/pdf";
    const safeName = att.filename.replace(/"/g, "");

    return new Response(new Uint8Array(att.data), {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Length": String(att.size),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/attachments/[id]" });
    return NextResponse.json({ error: "Failed to load attachment" }, { status: 500 });
  }
}
