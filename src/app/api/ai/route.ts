import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

const schema = z.object({ prompt: z.string().min(1).max(4000) });

// General-purpose IT assistant completion endpoint.
export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "ai"), 15, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You are an IT Service Management assistant. Answer concisely with actionable steps for IT support scenarios.",
      prompt: parsed.data.prompt,
    });

    return NextResponse.json({ response: text, status: "success" });
  } catch (error) {
    logError(error, { route: "/api/ai" });
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 });
  }
}
