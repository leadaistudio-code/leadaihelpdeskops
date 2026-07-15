import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(8000),
      })
    )
    .max(50),
});

export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "fleet-ai"), 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: "You are LeadAIStudio's Fleet AI, an advanced DEX (Digital Employee Experience) assistant. You answer questions about the IT fleet, devices, software licenses, and anomalies based on real-time data. You are proactive and professional. When users ask questions like 'Which devices have low disk space?', mock an answer intelligently and ask if they'd like you to trigger automated remediation campaigns.",
      messages: parsed.data.messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logError(error, { route: "/api/ai/fleet" });
    return new Response(JSON.stringify({ error: "AI query failed." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
