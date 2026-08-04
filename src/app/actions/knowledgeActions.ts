"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { requireAgent } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { logAudit } from "@/lib/audit";
import { LIST_LIMIT } from "@/lib/query-limits";

export async function createKnowledgeArticle(formData: FormData) {
  const author = await requireAgent();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const isPublished = formData.get("isPublished") === "true";

  const article = await prisma.knowledgeArticle.create({
    data: {
      title,
      content,
      // Authorship comes from the session, never from the form. Reading it from
      // client FormData let anyone publish an article under a colleague's name.
      authorId: author.id,
      isPublished,
      domain: await getActiveDomain(),
    },
  });

  await logAudit({
    domain: article.domain,
    action: "CREATE",
    entityType: "KnowledgeArticle",
    entityId: article.id,
    entityLabel: article.title,
    summary: `Knowledge article "${article.title}" created${isPublished ? " and published" : " as a draft"}`,
    actor: { id: author.id, name: author.name, email: author.email },
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
    take: LIST_LIMIT,
  });
}

// AI-drafts a reusable knowledge article from a resolved incident and saves it
// as an unpublished draft for an agent to review. Returns the new article id.
export async function draftArticleFromIncident(incidentId: string) {
  // Staff-only. This was reachable by any signed-in user: it calls a paid model
  // on demand and writes an article into the tenant, so it is both a spend and a
  // content-integrity surface.
  const staff = await requireAgent();
  const domain = await getActiveDomain();
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, domain } });
  if (!incident) throw new Error("Incident not found");

  // Attribute to the incident's assignee when there is one, otherwise to the
  // person who asked for the draft. Never to `findFirst()` — that picked an
  // arbitrary user from *any* tenant and stamped their name on the article.
  const authorId = incident.assigneeId ?? staff.id;

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

  await logAudit({
    domain,
    action: "CREATE",
    entityType: "KnowledgeArticle",
    entityId: article.id,
    entityLabel: article.title,
    summary: `AI-drafted knowledge article from incident ${incident.number}`,
    actor: { id: staff.id, name: staff.name, email: staff.email },
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
