"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    },
  });

  revalidatePath("/knowledge");
  return article;
}

export async function getKnowledgeArticles(searchQuery?: string) {
  return await prisma.knowledgeArticle.findMany({
    where: searchQuery ? {
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { content: { contains: searchQuery, mode: "insensitive" } },
      ],
      isPublished: true,
    } : { isPublished: true },
    include: {
      author: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getKnowledgeArticleById(id: string) {
  return await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });
}
