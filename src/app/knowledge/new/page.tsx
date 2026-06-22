export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createKnowledgeArticle } from "@/app/actions/knowledgeActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveDomain } from "@/lib/tenant";

export default async function NewKnowledgeArticlePage() {
  const users = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "IT_AGENT"] }, domain: await getActiveDomain() } });

  async function handleCreate(formData: FormData) {
    "use server";
    const article = await createKnowledgeArticle(formData);
    redirect(`/knowledge/${article.id}`);
  }

  const field = "w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 text-sm transition-colors";
  const label = "block text-sm font-bold text-slate-300 mb-2";

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <Link href="/knowledge" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Knowledge Article</h1>
      </div>

      <div className="glass-panel border border-white/10 rounded-3xl max-w-4xl mx-auto overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Article Details</h2>
        </div>
        <form action={handleCreate} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={label}>Author</label>
              <select name="authorId" required className={field}>
                <option value="">-- Select Author --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center mt-8">
              <input type="checkbox" name="isPublished" value="true" defaultChecked id="isPublished" className="w-4 h-4 accent-emerald-500 bg-slate-900 border-white/10 rounded focus:ring-emerald-500" />
              <label htmlFor="isPublished" className="ml-2 block text-sm font-bold text-slate-300">Publish immediately</label>
            </div>
          </div>

          <div className="mb-6">
            <label className={label}>Article Title</label>
            <input type="text" name="title" required placeholder="e.g., How to connect to the corporate VPN" className={field} />
          </div>

          <div className="mb-6">
            <label className={label}>Article Content</label>
            <textarea name="content" rows={12} required className={field} placeholder="Write your knowledge article here..."></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
            <button type="submit" className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all font-bold text-sm">
              Save Article
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
