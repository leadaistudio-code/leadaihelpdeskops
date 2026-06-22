import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { scoreArticle } from "@/lib/text-rank";
import { getActiveDomain } from "@/lib/tenant";

const schema = z.object({ query: z.string().max(2000) });

export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "deflect"), 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ articles: [], answer: null });
    }
    const { query } = parsed.data;
    if (query.trim().length < 4) {
      return NextResponse.json({ articles: [], answer: null });
    }

    const published = await prisma.knowledgeArticle.findMany({
      where: { isPublished: true, domain: await getActiveDomain() },
      select: { id: true, title: true, content: true },
    });

    // Rank by simple relevance and keep the top matches.
    const ranked = published
      .map((a) => ({ ...a, score: scoreArticle(query, a.title, a.content) }))
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const articles = ranked.map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.content.slice(0, 160) + (a.content.length > 160 ? "…" : ""),
    }));

    // Generate a short self-service answer grounded in the matched articles.
    let answer: string | null = null;
    try {
      const kbContext = ranked
        .map((a) => `Title: ${a.title}\nContent: ${a.content}`)
        .join("\n\n");
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are an IT self-service assistant. A user described this issue:\n"${query}"\n\n${
          kbContext
            ? `Using ONLY the knowledge base below, give a short, friendly, step-by-step answer they can try themselves before filing a ticket. If the articles don't fully cover it, say so briefly.\n\nKnowledge Base:\n${kbContext}`
            : "There are no knowledge base articles available. Give one or two generic, safe first-step suggestions, and recommend filing a ticket if that doesn't help."
        }\n\nKeep it under 120 words.`,
      });
      answer = text;
    } catch (e) {
      console.error("Deflect AI error:", e);
      answer = null; // Non-fatal: still return article matches.
    }

    return NextResponse.json({ articles, answer });
  } catch (error) {
    logError(error, { route: "/api/ai/deflect" });
    return NextResponse.json({ error: "Failed to search knowledge." }, { status: 500 });
  }
}
