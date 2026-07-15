import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

const schema = z.object({
  action: z.enum(["INSTALL", "USAGE", "BULK_USAGE"]),
  softwareName: z.string().min(1).max(255).optional(),
  version: z.string().max(50).nullish(),
  foregroundMinutes: z.number().int().min(0).nullish(),
  softwareNames: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) {
      return NextResponse.json({ error: "Missing device key." }, { status: 401 });
    }

    const limit = rateLimit(`software:${deviceKey}`, 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const device = await prisma.device.findUnique({
      where: { deviceKey },
      select: { id: true, domain: true },
    });
    if (!device) {
      return NextResponse.json({ error: "Unknown device." }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid software payload." }, { status: 400 });
    }
    const data = parsed.data;

    if (data.action === "INSTALL") {
      if (!data.softwareName) {
        return NextResponse.json({ error: "softwareName is required for INSTALL." }, { status: 400 });
      }
      await prisma.softwareInstallation.upsert({
        where: {
          deviceId_softwareName: {
            deviceId: device.id,
            softwareName: data.softwareName,
          }
        },
        update: { version: data.version ?? null },
        create: {
          deviceId: device.id,
          softwareName: data.softwareName,
          version: data.version ?? null,
          domain: device.domain,
        },
      });
    } else if (data.action === "USAGE") {
      if (!data.softwareName) {
        return NextResponse.json({ error: "softwareName is required for USAGE." }, { status: 400 });
      }
      const minutes = data.foregroundMinutes ?? 0;
      await prisma.softwareUsage.upsert({
        where: {
          deviceId_softwareName: {
            deviceId: device.id,
            softwareName: data.softwareName,
          }
        },
        update: { 
          foregroundMinutes: { increment: minutes },
          lastUsedAt: new Date()
        },
        create: {
          deviceId: device.id,
          softwareName: data.softwareName,
          foregroundMinutes: minutes,
          lastUsedAt: new Date(),
          domain: device.domain,
        },
      });
    } else if (data.action === "BULK_USAGE" && data.softwareNames) {
      await Promise.all(data.softwareNames.map(name => 
        prisma.softwareUsage.upsert({
          where: {
            deviceId_softwareName: {
              deviceId: device.id,
              softwareName: name,
            }
          },
          update: { 
            lastUsedAt: new Date(),
            foregroundMinutes: { increment: 1 }
          },
          create: {
            deviceId: device.id,
            softwareName: name,
            foregroundMinutes: 1,
            lastUsedAt: new Date(),
            domain: device.domain,
          },
        })
      ));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "/api/agent/software" });
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
