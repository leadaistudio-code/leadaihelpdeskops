import { tool, type ToolSet } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createIncident } from "@/app/actions/incidentActions";
import type { Role } from "@prisma/client";

// The employee self-service assistant's tools.
//
// SECURITY: identity is NOT a tool parameter. The caller (viewer) and tenant
// (domain) are captured in the execute closure by the route from the session —
// the model only supplies query text and ticket fields. This is what stops a
// prompt-injected "look up user X's tickets" from working: there is no user-id
// input for the model to steer.
export type Viewer = { id: string; name: string | null; role: Role };

// Input schemas, kept separate so they can be asserted in tests to contain no
// identity field.
export const TOOL_SCHEMAS = {
  search_knowledge_base: z.object({
    query: z.string().describe("Keywords describing the user's problem, e.g. 'vpn disconnecting'."),
  }),
  get_my_tickets: z.object({}),
  get_my_device_health: z.object({}),
  create_ticket: z.object({
    title: z.string().describe("A short summary of the issue, e.g. 'Laptop won't connect to office WiFi'."),
    description: z.string().describe("Everything the user has told you about the problem, in their words."),
  }),
} as const;

// Provider-agnostic dispatch, fully scoped to the viewer + domain. Returns a
// plain JSON-serializable object; never throws for expected "nothing found"
// cases — it returns a shaped result so the model can respond helpfully.
export async function executeChatTool(
  name: string,
  input: unknown,
  viewer: Viewer,
  domain: string
): Promise<unknown> {
  const args = (input ?? {}) as Record<string, unknown>;

  switch (name) {
    case "search_knowledge_base": {
      const query = typeof args.query === "string" ? args.query : "";
      const terms = query
        .split(/[^a-z0-9]+/i)
        .map((t) => t.trim())
        .filter((t) => t.length > 1);

      const articles = await prisma.knowledgeArticle.findMany({
        where: {
          isPublished: true,
          domain,
          ...(terms.length
            ? {
                OR: terms.flatMap((term) => [
                  { title: { contains: term, mode: "insensitive" as const } },
                  { content: { contains: term, mode: "insensitive" as const } },
                ]),
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: { id: true, title: true, content: true },
      });

      return {
        found: articles.length,
        articles: articles.map((a) => ({
          id: a.id,
          title: a.title,
          // Trim to keep the tool result compact; the model can cite the link.
          excerpt: a.content.slice(0, 500),
          link: `/knowledge/${a.id}`,
        })),
      };
    }

    case "get_my_tickets": {
      const tickets = await prisma.incident.findMany({
        // Scoped to the viewer's own tickets in their tenant — never anyone else's.
        where: { domain, callerId: viewer.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { number: true, title: true, status: true, priority: true, createdAt: true },
      });
      return {
        count: tickets.length,
        tickets: tickets.map((t) => ({
          number: t.number,
          title: t.title,
          status: t.status,
          priority: t.priority,
          openedAt: t.createdAt.toISOString().slice(0, 10),
        })),
      };
    }

    case "get_my_device_health": {
      const select = {
        hostname: true, cpuPct: true, memUsedMb: true, memTotalMb: true,
        diskPct: true, batteryPct: true, latencyMs: true, lastSeenAt: true,
      } as const;

      // Prefer the authoritative owner link. Fall back to the free-text OS
      // username only when no device is owned by the viewer yet, and be honest
      // when nothing matches rather than returning someone else's machine.
      let device = await prisma.device.findFirst({
        where: { domain, ownerId: viewer.id },
        orderBy: { lastSeenAt: "desc" },
        select,
      });
      const name = viewer.name?.trim();
      if (!device && name) {
        device = await prisma.device.findFirst({
          where: { domain, ownerId: null, user: { contains: name, mode: "insensitive" } },
          orderBy: { lastSeenAt: "desc" },
          select,
        });
      }
      if (!device) return { matched: false, reason: "No device is registered to you in the fleet." };

      const onlineMs = 2 * 60 * 1000;
      const online = !!device.lastSeenAt && Date.now() - device.lastSeenAt.getTime() < onlineMs;
      return {
        matched: true,
        device: {
          hostname: device.hostname,
          online,
          cpuPct: device.cpuPct,
          memoryPct: device.memUsedMb && device.memTotalMb ? Math.round((device.memUsedMb / device.memTotalMb) * 100) : null,
          diskPct: device.diskPct,
          batteryPct: device.batteryPct,
          latencyMs: device.latencyMs,
          lastSeen: device.lastSeenAt?.toISOString() ?? null,
        },
      };
    }

    case "create_ticket": {
      const title = typeof args.title === "string" ? args.title.trim() : "";
      const description = typeof args.description === "string" ? args.description.trim() : "";
      if (!title) return { created: false, reason: "A title is required to file a ticket." };

      // callerId is forced to the viewer — the model cannot file as anyone else.
      const incident = await createIncident({
        title,
        description: description || title,
        callerId: viewer.id,
      });
      return {
        created: true,
        number: incident.number,
        link: `/incidents/${incident.id}`,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Build the Vercel AI SDK tool set for one request. The viewer + domain are
// closed over here — they come from the session, never from the model — so
// every tool call is scoped to the authenticated user.
export function buildChatTools(viewer: Viewer, domain: string): ToolSet {
  return {
    search_knowledge_base: tool({
      description:
        "Search the IT knowledge base for published help articles (password resets, VPN, hardware, etc.). Use this before answering any how-to question so the answer is grounded in the company's own documentation.",
      inputSchema: TOOL_SCHEMAS.search_knowledge_base,
      execute: (args) => executeChatTool("search_knowledge_base", args, viewer, domain),
    }),
    get_my_tickets: tool({
      description:
        "List the current user's own IT tickets and their status. Use when the user asks about the status of a request they filed, or whether they have anything open.",
      inputSchema: TOOL_SCHEMAS.get_my_tickets,
      execute: (args) => executeChatTool("get_my_tickets", args, viewer, domain),
    }),
    get_my_device_health: tool({
      description:
        "Get live health telemetry (CPU, memory, disk, battery, last-seen) for the device registered to the current user. Use when the user reports their machine is slow, hot, or having hardware trouble.",
      inputSchema: TOOL_SCHEMAS.get_my_device_health,
      execute: (args) => executeChatTool("get_my_device_health", args, viewer, domain),
    }),
    create_ticket: tool({
      description:
        "File a new IT support ticket on behalf of the current user. Only call this after confirming with the user that they want a ticket raised, and after a knowledge-base answer did not resolve it.",
      inputSchema: TOOL_SCHEMAS.create_ticket,
      execute: (args) => executeChatTool("create_ticket", args, viewer, domain),
    }),
  };
}
