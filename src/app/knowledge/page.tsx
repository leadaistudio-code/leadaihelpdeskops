import Link from "next/link";
import { getKnowledgeArticles } from "@/app/actions/knowledgeActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookOpen, Plus, Search, FileText } from "lucide-react";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  const isEmployee = session?.user?.role === "EMPLOYEE";

  // Fix for Next.js 15+ where searchParams is a Promise. (We are using 16)
  const resolvedParams = await Promise.resolve(searchParams);
  const q = resolvedParams.q || "";
  const articles = await getKnowledgeArticles(q);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-4 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Knowledge Base</h1>
            <p className="text-slate-400 mt-1">Find answers, troubleshooting steps, and policies.</p>
          </div>
        </div>
        {!isEmployee && (
          <Link href="/knowledge/new" className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all font-bold">
            <Plus className="w-4 h-4" />
            <span>Create Article</span>
          </Link>
        )}
      </div>

      <div className="mb-10">
        <form className="relative group flex">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            name="q"
            defaultValue={q}
            placeholder="Search for articles..." 
            className="flex-1 max-w-2xl pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-500 text-lg shadow-inner"
          />
          <button type="submit" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-r-2xl shadow-lg font-bold hover:brightness-110 transition-all">
            Search
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Search Results</h2>
          <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400">{articles.length} Articles</span>
        </div>
        <div className="divide-y divide-white/5">
          {articles.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic">No articles found matching your query.</div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="p-8 hover:bg-white/5 transition-colors group">
                <Link href={`/knowledge/${article.id}`} className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400 group-hover:text-emerald-300 mb-2 transition-colors">{article.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">{article.content}</p>
                    <div className="flex items-center text-xs text-slate-500 font-medium space-x-6">
                      <span className="flex items-center space-x-2">
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
      </div>
    </div>
  );
}
