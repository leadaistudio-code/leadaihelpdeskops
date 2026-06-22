import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { scoreArticle } from "@/lib/text-rank";
import { getActiveDomain } from "@/lib/tenant";

const schema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "suggest"), 15, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { title, description } = parsed.data;

    // Fetch published articles, then rank by relevance to THIS incident so the
    // model gets the most useful context rather than an arbitrary five.
    const all = await prisma.knowledgeArticle.findMany({
      where: { isPublished: true, domain: await getActiveDomain() },
      select: { title: true, content: true },
    });
    const query = `${title} ${description}`;
    const articles = all
      .map((a) => ({ ...a, score: scoreArticle(query, a.title, a.content) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const kbContext = articles.map(a => `Title: ${a.title}\nContent: ${a.content}`).join("\n\n");

    const prompt = `
You are an expert IT Helpdesk AI Assistant. Provide a suggested resolution for the following incident.
If applicable, reference the provided Knowledge Base articles.

Incident Title: ${title}
Incident Description: ${description}

Available Knowledge Base Articles:
${kbContext}

Provide a concise, actionable resolution for the IT Agent to send to the user or follow themselves.
`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    return NextResponse.json({ suggestion: text });
  } catch (error) {
    logError(error, { route: "/api/ai/suggest" });
    return NextResponse.json({ error: "Failed to generate suggestion." }, { status: 500 });
  }
}
