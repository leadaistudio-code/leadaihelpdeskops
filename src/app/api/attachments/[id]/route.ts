import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { logError } from "@/lib/observability";

// Stream a stored attachment back to the browser. Images/PDFs render inline;
// other types download. Access is gated to authenticated users.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await ctx.params;
    const att = await prisma.attachment.findUnique({ where: { id } });
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
