export const dynamic = "force-dynamic";

import { getKnowledgeArticleById } from "@/app/actions/knowledgeActions";
import { getAttachmentsForArticle } from "@/app/actions/attachmentActions";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, User, Eye } from "lucide-react";
import KbFeedback from "@/components/KbFeedback";
import AttachmentPanel from "@/components/AttachmentPanel";
import { PageHeader, Panel, Button } from "@/components/ui";

export default async function KnowledgeArticleDetailPage({ params }: { params: { id: string } }) {
  const id = (await Promise.resolve(params)).id;
  const article = await getKnowledgeArticleById(id);

  if (!article) {
    notFound();
  }

  const attachments = await getAttachmentsForArticle(id);

  // Mock views for demonstration based on ID
  const viewsCount = parseInt(id) * 142 || 452;

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 mt-4">
          <Button href="/knowledge" variant="ghost" size="sm" icon={ChevronLeft}>
            Back to Knowledge Base
          </Button>
        </div>

        <PageHeader title={article.title} />

        <Panel className="overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">{article.author?.name || "System Admin"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-400">Updated: {article.updatedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">{viewsCount.toLocaleString()} Views</span>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="prose prose-invert max-w-prose">
              <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {article.content}
              </div>
            </div>

            <KbFeedback initialViews={viewsCount} />
          </div>
        </Panel>

        <div className="mt-6">
          <AttachmentPanel articleId={article.id} attachments={attachments} />
        </div>
      </div>
    </div>
  );
}
