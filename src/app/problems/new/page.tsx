export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createProblem } from "@/app/actions/problemActions";
import type { Priority } from "@prisma/client";
import { ChevronLeft } from "lucide-react";
import { PageHeader, Button, Panel, Field, Input, Textarea, Select } from "@/components/ui";

export default function NewProblemPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const priority = (formData.get("priority") as Priority) || "MEDIUM";
    if (!title || !description) return;
    const problem = await createProblem({ title, description, priority });
    redirect(`/problems/${problem.id}`);
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center gap-4 mb-6 mt-4">
        <Button href="/problems" variant="ghost" size="sm" icon={ChevronLeft}>
          Back
        </Button>
      </div>

      <PageHeader title="New Problem" description="Open a root-cause investigation." />

      <Panel padded className="max-w-2xl">
        <form action={handleCreate} className="space-y-6">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              required
              name="title"
              type="text"
              placeholder="e.g. Intermittent VPN drops for remote staff"
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              required
              name="description"
              rows={6}
              placeholder="Symptoms, affected services, and the pattern of incidents…"
            />
          </Field>
          <Field label="Priority" htmlFor="priority">
            <Select id="priority" name="priority" defaultValue="MEDIUM">
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </Select>
          </Field>
          <Button type="submit" className="w-full">
            Create Problem
          </Button>
        </form>
      </Panel>
    </div>
  );
}
