import prisma from "@/lib/prisma";
import { createKnowledgeArticle } from "@/app/actions/knowledgeActions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewKnowledgeArticlePage() {
  const users = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "IT_AGENT"] } } });

  async function handleCreate(formData: FormData) {
    "use server";
    const article = await createKnowledgeArticle(formData);
    redirect(`/knowledge/${article.id}`);
  }

  return (
    <div className="p-6 h-full overflow-auto bg-slate-50">
      <div className="flex justify-between items-center mb-6 border-b border-slate-300 pb-4">
        <div className="flex items-center space-x-4">
          <Link href="/knowledge" className="text-slate-500 hover:text-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-800">Create Knowledge Article</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-sm max-w-4xl mx-auto">
        <form action={handleCreate} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Author</label>
              <select name="authorId" required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm">
                <option value="">-- Select Author --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center mt-6">
              <input type="checkbox" name="isPublished" value="true" defaultChecked id="isPublished" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              <label htmlFor="isPublished" className="ml-2 block text-sm font-bold text-slate-700">Publish immediately</label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Article Title</label>
            <input type="text" name="title" required placeholder="e.g., How to connect to the corporate VPN" className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Article Content</label>
            <textarea name="content" rows={12} required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm" placeholder="Write your knowledge article here..."></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm text-sm hover:bg-blue-700 font-bold">
              Save Article
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
