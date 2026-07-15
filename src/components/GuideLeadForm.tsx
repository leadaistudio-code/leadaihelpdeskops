"use client";

import { useState } from "react";
import { CheckCircle2, Download, Loader2, ArrowRight } from "lucide-react";
import { captureLead } from "@/app/actions/leadActions";

// Gated lead-capture form for the CIO's Guide. Captures the visitor's basic
// details, then reveals a personalised download link once the lead is stored.
export function GuideLeadForm({ source }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const formData = new FormData(e.currentTarget);
    if (source) formData.set("source", source);
    const result = await captureLead(formData);
    if (result.ok) {
      setDownloadUrl(`/api/guides/cio-guide/download?lead=${result.leadId}`);
    } else {
      setError(result.error);
      setStatus("idle");
    }
  }

  if (downloadUrl) {
    return (
      <div className="rounded-xl border border-[#00d4a4]/30 bg-white p-8 shadow-[0_8px_24px_rgba(0,212,164,0.08)]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00d4a4]/10">
            <CheckCircle2 className="h-7 w-7 text-[#00926f]" />
          </div>
          <h3 className="text-xl font-semibold text-[#0a0a0a]">Your guide is ready</h3>
          <p className="mt-2 max-w-sm text-sm text-[#6b6b6d]">
            We&apos;ve personalised a copy for you. Click below to download the 24-page PDF.
          </p>
          <a
            href={downloadUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c1c1e]"
          >
            <Download className="h-4 w-4" />
            Download the guide
          </a>
          <p className="mt-4 text-xs text-[#6b6b6d]">PDF · ~24 pages · no email confirmation needed</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[#e5e5e5] bg-white p-7 shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <h3 className="text-lg font-semibold text-[#0a0a0a]">Get the free guide</h3>
      <p className="mt-1 text-sm text-[#6b6b6d]">
        Tell us where to send it. The download unlocks instantly.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Full name" name="name" type="text" placeholder="Your full name" autoComplete="name" />
        <Field
          label="Work email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Field label="Company" name="company" type="text" placeholder="Your company" autoComplete="organization" />
        <Field
          label="Job title"
          name="jobTitle"
          type="text"
          placeholder="CIO / IT Director"
          autoComplete="organization-title"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-[#d45656]/10 px-3 py-2 text-sm text-[#d45656]">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c1c1e] disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your guide…
          </>
        ) : (
          <>
            Unlock the download
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-[#6b6b6d]">
        We&apos;ll only use your details to share this guide and related insights. Unsubscribe anytime.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#3a3a3c]">{label}</span>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5 text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#a8a8aa] focus:border-[#00d4a4] focus:bg-white focus:ring-2 focus:ring-[#00d4a4]/20"
      />
    </label>
  );
}
