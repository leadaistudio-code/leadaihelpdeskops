import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    // Fetch published knowledge articles to provide as context
    const articles = await prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
      select: { title: true, content: true },
      take: 5,
    });

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
    console.error("AI Suggestion error:", error);
    return NextResponse.json({ error: "Failed to generate suggestion." }, { status: 500 });
  }
}
