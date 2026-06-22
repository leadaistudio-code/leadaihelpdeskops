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
    const limit = rateLimit(await callerKey(req, "chat"), 30, 60_000);
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
      messages: [
        {
          role: "system",
          content:
            "You are a helpful IT Support AI assistant for our internal Helpdesk. Help users troubleshoot common issues like VPN, passwords, and hardware issues concisely. Provide actionable steps.",
        },
        ...parsed.data.messages,
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logError(error, { route: "/api/chat" });
    return new Response(JSON.stringify({ error: "Chat failed." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
