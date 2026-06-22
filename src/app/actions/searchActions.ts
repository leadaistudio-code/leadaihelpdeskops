"use server";

import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";

export type SearchResults = {
  incidents: { id: string; number: string; title: string; status: string }[];
  assets: { id: string; assetTag: string; name: string; category: string }[];
  articles: { id: string; title: string }[];
};

// Cross-entity search over incidents, assets, and published knowledge. Employees
// only see their own incidents; agents/admins see all.
export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return { incidents: [], assets: [], articles: [] };

  const user = await getSessionUser();
  const isEmployee = user?.role === "EMPLOYEE";
  const domain = await getActiveDomain();

  const [incidents, assets, articles] = await Promise.all([
    prisma.incident.findMany({
      where: {
        domain,
        ...(isEmployee && user ? { callerId: user.id } : {}),
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, number: true, title: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    isEmployee
      ? Promise.resolve([])
      : prisma.asset.findMany({
          where: {
            domain,
            OR: [
              { assetTag: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, assetTag: true, name: true, category: true },
          take: 8,
        }),
    prisma.knowledgeArticle.findMany({
      where: {
        isPublished: true,
        domain,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true },
      take: 8,
    }),
  ]);

  return { incidents, assets, articles };
}
