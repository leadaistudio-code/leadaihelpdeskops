export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createKnowledgeArticle } from "@/app/actions/knowledgeActions";
import { redirect } from "next/navigation";
import { getActiveDomain } from "@/lib/tenant";
import { ChevronLeft } from "lucide-react";
import { PageHeader, Panel, PanelHeader, Button, Field, Input, Textarea, Select } from "@/components/ui";

export default async function NewKnowledgeArticlePage() {
  const users = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "IT_AGENT"] }, domain: await getActiveDomain() } });

  async function handleCreate(formData: FormData) {
    "use server";
    const article = await createKnowledgeArticle(formData);
    redirect(`/knowledge/${article.id}`);
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="mb-6 mt-4">
        <Button href="/knowledge" variant="ghost" size="sm" icon={ChevronLeft}>
          Back to Knowledge Base
        </Button>
      </div>

      <PageHeader title="Create Knowledge Article" />

      <Panel className="max-w-4xl mx-auto overflow-hidden">
        <PanelHeader title="Article Details" />
        <form action={handleCreate} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Author">
              <Select name="authorId" required defaultValue="">
                <option value="">-- Select Author --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center mt-8">
              <input type="checkbox" name="isPublished" value="true" defaultChecked id="isPublished" className="w-4 h-4 accent-[#00b48a] bg-slate-900 border-white/10 rounded focus:ring-[#00d4a4]" />
              <label htmlFor="isPublished" className="ml-2 block text-sm font-semibold text-slate-300">Publish immediately</label>
            </div>
          </div>

          <div className="mb-6">
            <Field label="Article Title">
              <Input type="text" name="title" required placeholder="e.g., How to connect to the corporate VPN" />
            </Field>
          </div>

          <div className="mb-6">
            <Field label="Article Content">
              <Textarea name="content" rows={12} required placeholder="Write your knowledge article here…" />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <Button type="submit">Save Article</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
