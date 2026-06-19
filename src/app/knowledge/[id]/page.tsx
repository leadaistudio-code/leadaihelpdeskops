export const dynamic = "force-dynamic";

import { getKnowledgeArticleById } from "@/app/actions/knowledgeActions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, BookOpen, Clock, User, Eye } from "lucide-react";
import KbFeedback from "@/components/KbFeedback";

export default async function KnowledgeArticleDetailPage({ params }: { params: { id: string } }) {
  const id = (await Promise.resolve(params)).id;
  const article = await getKnowledgeArticleById(id);

  if (!article) {
    notFound();
  }

  // Mock views for demonstration based on ID
  const viewsCount = parseInt(id) * 142 || 452;

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-10 mt-4">
          <Link href="/knowledge" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group shrink-0">
            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">{article.title}</h1>
          </div>
        </div>

        <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          
          <div className="px-8 py-6 border-b border-white/5 bg-slate-900/80 flex flex-wrap gap-6 items-center">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">{article.author?.name || "System Admin"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-400">Updated: {article.updatedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-medium text-slate-300">{viewsCount.toLocaleString()} Views</span>
            </div>
          </div>
          
          <div className="p-8 md:p-10">
            <div className="prose prose-invert prose-emerald max-w-none">
              <div className="text-slate-200 whitespace-pre-wrap leading-relaxed text-lg font-medium">
                {article.content}
              </div>
            </div>

            <KbFeedback initialViews={viewsCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
