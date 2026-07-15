export const dynamic = "force-dynamic";

import Link from "next/link";
import { getKnowledgeArticles } from "@/app/actions/knowledgeActions";
import { getSessionUser } from "@/lib/auth-utils";
import { BookOpen, Plus, Search, FileText, SearchX } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { PageHeader, Button, Panel, PanelHeader, Input, Badge, cn, focusRing } from "@/components/ui";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await getSessionUser();
  const isEmployee = user?.role === "EMPLOYEE";

  // Fix for Next.js 15+ where searchParams is a Promise. (We are using 16)
  const resolvedParams = await Promise.resolve(searchParams);
  const q = resolvedParams.q || "";
  const articles = await getKnowledgeArticles(q);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Knowledge Base"
        description="Find answers, troubleshooting steps, and policies."
        action={
          !isEmployee && (
            <Button href="/knowledge/new" icon={Plus}>
              Create Article
            </Button>
          )
        }
      />

      <div className="mb-8">
        <form className="relative flex gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search for articles…"
              className="pl-11"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Search Results"
          action={<Badge tone="neutral">{articles.length} Articles</Badge>}
        />
        <div className="divide-y divide-white/5">
          {articles.length === 0 ? (
            q ? (
              <EmptyState
                icon={SearchX}
                title="No matching articles"
                description={`Nothing found for "${q}". Try a different search term${isEmployee ? "." : ", or create the article yourself."}`}
                ctaHref={isEmployee ? undefined : "/knowledge/new"}
                ctaLabel={isEmployee ? undefined : "Create Article"}
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="The knowledge base is empty"
                description={isEmployee ? "No articles have been published yet. Check back soon." : "Capture your first troubleshooting guide or policy so the AI can surface it on future tickets."}
                ctaHref={isEmployee ? undefined : "/knowledge/new"}
                ctaLabel={isEmployee ? undefined : "Create Article"}
              />
            )
          ) : (
            articles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-white/5 transition-colors group">
                <Link href={`/knowledge/${article.id}`} className={cn("flex items-start gap-4 rounded-sm", focusRing)}>
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-100 group-hover:text-[#00926f] mb-2 transition-colors">{article.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed max-w-prose">{article.content}</p>
                    <div className="flex items-center text-xs text-slate-500 font-medium gap-6">
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">{article.author?.name?.charAt(0) || 'U'}</div>
                        <span>{article.author?.name || "Unknown"}</span>
                      </span>
                      <span>Updated {article.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
