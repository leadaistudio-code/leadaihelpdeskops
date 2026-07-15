"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Lock, Settings2, Send } from "lucide-react";
import { addIncidentNote } from "@/app/actions/incidentActions";
import { toast } from "@/components/toast";
import { Panel, PanelHeader, Button, Textarea } from "@/components/ui";

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
    <Panel className="overflow-hidden">
      <PanelHeader title="Activity & Notes" icon={MessageSquare} />

      {/* Composer */}
      <div className="p-6 border-b border-white/5">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setKind("COMMENT")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/40 ${
              kind === "COMMENT" ? "bg-[#00d4a4]/10 text-[#00926f] border border-[#00d4a4]/25" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Comment
          </button>
          <button
            onClick={() => setKind("WORK_NOTE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
              kind === "WORK_NOTE" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Work note (internal)
          </button>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={kind === "WORK_NOTE" ? "Internal note for the IT team…" : "Add a comment visible to the caller…"}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={submit} icon={Send} loading={pending} disabled={pending || !body.trim()}>
            {pending ? "Posting…" : "Post"}
          </Button>
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
                      isSystem ? "bg-white/5 text-slate-400" : isWork ? "bg-amber-500/15 text-amber-400" : "bg-[#00d4a4]/10 text-[#00926f]"
                    }`}
                  >
                    {isSystem ? <Settings2 className="w-4 h-4" /> : isWork ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-semibold text-slate-300">{n.author?.name ?? "System"}</span>
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
    </Panel>
  );
}
