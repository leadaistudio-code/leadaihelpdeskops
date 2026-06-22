"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";

export async function createKnowledgeArticle(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const authorId = formData.get("authorId") as string;
  const isPublished = formData.get("isPublished") === "true";

  const article = await prisma.knowledgeArticle.create({
    data: {
      title,
      content,
      authorId,
      isPublished,
      domain: await getActiveDomain(),
    },
  });

  revalidatePath("/knowledge");
  return article;
}

export async function getKnowledgeArticles(searchQuery?: string) {
  const domain = await getActiveDomain();
  // Tokenize the query so "vpn connect" matches articles containing EITHER term
  // (across title or content), instead of requiring the exact phrase.
  const terms = (searchQuery ?? "")
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  const where =
    terms.length > 0
      ? {
          isPublished: true,
          domain,
          OR: terms.flatMap((term) => [
            { title: { contains: term, mode: "insensitive" as const } },
            { content: { contains: term, mode: "insensitive" as const } },
          ]),
        }
      : { isPublished: true, domain };

  return await prisma.knowledgeArticle.findMany({
    where,
    include: { author: true },
    orderBy: { updatedAt: "desc" },
  });
}

// AI-drafts a reusable knowledge article from a resolved incident and saves it
// as an unpublished draft for an agent to review. Returns the new article id.
export async function draftArticleFromIncident(incidentId: string) {
  const domain = await getActiveDomain();
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, domain } });
  if (!incident) throw new Error("Incident not found");

  const sessionUser = await getSessionUser();
  const authorId =
    incident.assigneeId ??
    sessionUser?.id ??
    (await prisma.user.findFirst())?.id;
  if (!authorId) throw new Error("No author available to attribute the article");

  let title = `How to resolve: ${incident.title}`;
  let content = incident.description;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        title: z.string().describe("A clear, searchable knowledge article title."),
        content: z
          .string()
          .describe("A concise, reusable troubleshooting article with numbered steps, written for end users."),
      }),
      prompt: `Turn this resolved IT incident into a reusable knowledge base article.\n\nTitle: ${incident.title}\nDetails (may include AI triage notes): ${incident.description}\n\nWrite a general, reusable article — not specific to one user. Use numbered steps where helpful.`,
    });
    title = object.title;
    content = object.content;
  } catch (e) {
    console.error("KB drafting failed, using fallback:", e);
  }

  const article = await prisma.knowledgeArticle.create({
    data: { title, content, authorId, isPublished: false, domain },
  });

  revalidatePath("/knowledge");
  return article;
}

export async function getKnowledgeArticleById(id: string) {
  return await prisma.knowledgeArticle.findFirst({
    where: { id, domain: await getActiveDomain() },
    include: {
      author: true,
    },
  });
}
