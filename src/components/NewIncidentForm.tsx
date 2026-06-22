"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { createIncident } from "@/app/actions/incidentActions";
import { toast } from "@/components/toast";
import type { Priority } from "@prisma/client";

const field =
  "w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm transition-colors";
const label = "block text-sm font-bold text-slate-300 mb-2";

const MAX_BYTES = 5 * 1024 * 1024;

export default function NewIncidentForm({ user }: { user: { id: string; name: string; role: string } }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "LOW" });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_BYTES) {
        toast(`${f.name} exceeds 5MB`, "error");
        continue;
      }
      next.push(f);
    }
    setFiles((prev) => [...prev, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    startTransition(async () => {
      try {
        const incident = await createIncident({
          title: form.title,
          description: form.description,
          priority: form.priority as Priority,
          callerId: user.id,
          type: "INCIDENT",
          status: "NEW",
        });

        // Upload any attached files now that we have an incident id.
        for (const f of files) {
          const fd = new FormData();
          fd.set("incidentId", incident.id);
          fd.set("file", f);
          const res = await fetch("/api/attachments", { method: "POST", body: fd });
          if (!res.ok) toast(`Couldn't attach ${f.name}`, "error");
        }

        toast("Incident submitted");
        router.push(`/incidents/${incident.id}`);
      } catch {
        toast("Couldn't submit incident", "error");
      }
    });
  };

  return (
    <form onSubmit={submit} className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className={label}>Caller</label>
          <input type="text" disabled value={`${user.name} (${user.role})`} className="w-full px-4 py-3 border border-white/10 bg-slate-900/80 rounded-xl text-sm text-slate-400 cursor-not-allowed" />
        </div>
        <div>
          <label className={label}>Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={field}>
            <option value="LOW">4 - Low</option>
            <option value="MEDIUM">3 - Moderate</option>
            <option value="HIGH">2 - High</option>
            <option value="CRITICAL">1 - Critical</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className={label}>Short Description</label>
        <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief summary of the issue" className={field} />
      </div>

      <div className="mb-6">
        <label className={label}>Description</label>
        <textarea required rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail — our AI will triage it on submit." className={field} />
      </div>

      <div className="mb-6">
        <label className={label}>Attachments (optional)</label>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-2xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
          <Paperclip className="w-4 h-4" /> Add files (max 5MB each)
        </button>
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-xl text-sm">
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300 truncate flex-1">{f.name}</span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-rose-400">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
        <button type="submit" disabled={pending || !form.title.trim() || !form.description.trim()} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all font-bold text-sm disabled:opacity-50">
          {pending ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
