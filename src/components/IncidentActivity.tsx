"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Lock, Settings2, Send } from "lucide-react";
import { addIncidentNote } from "@/app/actions/incidentActions";
import { toast } from "@/components/toast";

type Note = {
  id: string;
  body: string;
  type: "COMMENT" | "WORK_NOTE" | "SYSTEM";
  createdAt: string | Date;
  author?: { name: string } | null;
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleDateString();
}

export default function IncidentActivity({ incidentId, notes }: { incidentId: string; notes: Note[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"COMMENT" | "WORK_NOTE">("COMMENT");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        await addIncidentNote(incidentId, body, kind);
        setBody("");
        toast(kind === "WORK_NOTE" ? "Work note added" : "Comment posted");
        router.refresh();
      } catch {
        toast("Couldn't save note", "error");
      }
    });
  };

  return (
    <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
      <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
        <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Activity & Notes</h2>
      </div>

      {/* Composer */}
      <div className="p-6 border-b border-white/5">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setKind("COMMENT")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              kind === "COMMENT" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Comment
          </button>
          <button
            onClick={() => setKind("WORK_NOTE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              kind === "WORK_NOTE" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Work note (internal)
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={kind === "WORK_NOTE" ? "Internal note for the IT team…" : "Add a comment visible to the caller…"}
          className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm transition-colors"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={submit}
            disabled={pending || !body.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg hover:brightness-110 transition-all font-bold text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No activity yet. Add the first note above.</p>
        ) : (
          <ol className="space-y-5">
            {notes.map((n) => {
              const created = new Date(n.createdAt);
              const isSystem = n.type === "SYSTEM";
              const isWork = n.type === "WORK_NOTE";
              return (
                <li key={n.id} className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSystem ? "bg-slate-700/40 text-slate-400" : isWork ? "bg-amber-500/15 text-amber-400" : "bg-indigo-500/15 text-indigo-400"
                    }`}
                  >
                    {isSystem ? <Settings2 className="w-4 h-4" /> : isWork ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-bold text-slate-300">{n.author?.name ?? "System"}</span>
                      {isWork && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px] font-bold uppercase">Internal</span>}
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500">{timeAgo(created)}</span>
                    </div>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isSystem ? "text-slate-500 italic" : "text-slate-300"}`}>{n.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
