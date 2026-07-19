import { generateText, stepCountIs, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { isAIConfigured, MODELS } from "@/lib/ai";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { buildChatTools, type Viewer } from "@/lib/chat-tools";

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

// Bound the agentic loop: a helpdesk answer needs a few tool calls at most.
// This is a runaway backstop, not a normal limit.
const MAX_STEPS = 6;

const SYSTEM_PROMPT = `You are "Now Assist", the virtual IT support agent in an internal IT helpdesk.
You are speaking with an employee (an end user), not an IT technician.

How to help:
- For how-to and troubleshooting questions, search the knowledge base first and answer from what you find. When you use an article, cite its title as a markdown link, e.g. [Reset your password](/knowledge/abc).
- When the user asks about the status of a request, or whether they have anything open, look up their own tickets.
- When the user says their machine is slow, hot, or misbehaving, check their device health before guessing.
- If the knowledge base does not resolve the issue, offer to file a ticket. Only file one after the user agrees, and confirm the ticket number back to them.

Boundaries:
- You can only see the tickets and device belonging to the person you are talking to. If a tool returns nothing for them, say so plainly rather than guessing.
- Do not claim to have taken an action unless a tool result confirms it.
- If the user asks for a human, tell them you'll flag it for a live agent.
Keep replies short and concrete — a sentence or two, plus the next step.`;

export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "chat"), 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const user = await getSessionUser();
    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    // Graceful degradation when the tenant hasn't configured OpenAI — the app
    // must not 500 just because no key is set.
    if (!isAIConfigured()) {
      return Response.json({
        reply:
          "The AI assistant isn't switched on for this workspace yet. You can still search the knowledge base or raise a ticket from the portal.",
      });
    }

    const domain = await getActiveDomain();
    const viewer: Viewer = { id: user.id, name: user.name, role: user.role };

    const messages: ModelMessage[] = parsed.data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await generateText({
      model: openai(MODELS.CHAT),
      system: SYSTEM_PROMPT,
      messages,
      tools: buildChatTools(viewer, domain),
      // Runs the tool loop: model calls tools, their execute() runs, results
      // feed back, until the model answers or the step cap is hit.
      stopWhen: stepCountIs(MAX_STEPS),
    });

    const reply =
      result.text.trim() ||
      "Sorry — I couldn't finish that just now. Could you rephrase, or would you like me to raise a ticket?";

    return Response.json({ reply });
  } catch (error) {
    logError(error, { route: "/api/chat" });
    return Response.json({ error: "Chat failed." }, { status: 500 });
  }
}

// Surfaced to the client so the widget can show a graceful "AI is off" state.
export function GET() {
  return Response.json({ configured: isAIConfigured() });
}
