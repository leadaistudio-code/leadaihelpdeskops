"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Upload, FileText, Image as ImageIcon, File as FileIcon, Download, Trash2 } from "lucide-react";
import { deleteAttachment } from "@/app/actions/attachmentActions";
import { toast } from "@/components/toast";
import { formatBytes } from "@/lib/text-rank";
import { Panel, PanelHeader, focusRing, cn } from "@/components/ui";

type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: string | null;
};

const MAX_BYTES = 5 * 1024 * 1024;

function FileGlyph({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-slate-300" />;
  if (mime === "application/pdf") return <FileText className="w-5 h-5 text-rose-400" />;
  if (mime.startsWith("text/")) return <FileText className="w-5 h-5 text-emerald-400" />;
  return <FileIcon className="w-5 h-5 text-slate-400" />;
}

export default function AttachmentPanel({
  incidentId,
  articleId,
  attachments,
}: {
  incidentId?: string;
  articleId?: string;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const onFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast("File exceeds the 5MB limit", "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      if (incidentId) fd.set("incidentId", incidentId);
      if (articleId) fd.set("articleId", articleId);
      fd.set("file", file);
      const res = await fetch("/api/attachments", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast("File attached");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) =>
    startTransition(async () => {
      try {
        await deleteAttachment(id);
        toast("Attachment removed");
        router.refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Couldn't remove", "error");
      }
    });

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title="Attachments"
        icon={Paperclip}
        action={<span className="text-xs text-slate-500">{attachments.length}</span>}
      />

      <div className="p-6">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50",
            focusRing
          )}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload file (max 5MB)"}
        </button>

        {attachments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No files attached yet.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                {a.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/attachments/${a.id}`} alt={a.filename} className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <FileGlyph mime={a.mimeType} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">{a.filename}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(a.size)}
                    {a.uploadedBy ? ` · ${a.uploadedBy}` : ""}
                  </p>
                </div>
                <a
                  href={`/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("p-2 text-slate-400 hover:text-[#00926f] hover:bg-white/5 rounded-lg transition-colors", focusRing)}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  className={cn("p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50", focusRing)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
