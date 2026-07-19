import { generateText, stepCountIs, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { isAIConfigured, MODELS } from "@/lib/ai";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { buildFleetTools } from "@/lib/fleet-tools";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      })
    )
    .min(1)
    .max(40),
});

const MAX_STEPS = 6;

const SYSTEM_PROMPT = `You are "Fleet Copilot", an assistant for IT operations staff inside a DEX (Digital Employee Experience) console.
You help an IT agent understand and triage the device fleet.

How to help:
- Answer questions about the fleet ONLY from tool results — never from memory or assumption.
- "At risk", "unhealthy", or "needs attention" means current operational trouble — call list_devices with filter 'at_risk' (it flags offline and overloaded machines). Do NOT use get_hardware_risks for these; that tool is only for predicted future component failures.
- Any question about which devices match a condition REQUIRES a list_devices call with the matching filter. Report exactly the count and hostnames it returns; never answer "none" or a count without having called the tool.
- Lead with the number or the short list the agent asked for, then one line of context.
- When you surface at-risk or failing devices, name the hostnames so the agent can act on them.

Boundaries:
- You are read-only. You cannot run remediation, reboot, or reclaim licences yourself — point the agent to the relevant control instead of claiming you did it.
- Everything you see is this tenant's fleet only.
Keep replies short and scannable — a sentence or a tight list, not paragraphs.`;

export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "fleet-ai"), 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    // Agent-only: the fleet view spans every user's device, so an employee
    // must not reach it.
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });
    if (user.role !== "ADMIN" && user.role !== "IT_AGENT") {
      return Response.json({ error: "Not authorized." }, { status: 403 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return Response.json({
        reply: "The Fleet Copilot isn't switched on for this workspace yet. The dashboards below still show live fleet data.",
      });
    }

    const domain = await getActiveDomain();
    const messages: ModelMessage[] = parsed.data.messages.map((m) => ({ role: m.role, content: m.content }));

    const result = await generateText({
      model: openai(MODELS.CHAT),
      system: SYSTEM_PROMPT,
      messages,
      tools: buildFleetTools(domain),
      stopWhen: stepCountIs(MAX_STEPS),
    });

    const reply =
      result.text.trim() ||
      "I couldn't pull that together just now — try rephrasing, or check the dashboards below.";

    return Response.json({ reply });
  } catch (error) {
    logError(error, { route: "/api/ai/fleet" });
    return Response.json({ error: "Fleet query failed." }, { status: 500 });
  }
}
