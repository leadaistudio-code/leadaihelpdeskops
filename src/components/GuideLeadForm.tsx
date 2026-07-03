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
      <div className="rounded-2xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-100/50">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Your guide is ready</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            We&apos;ve personalised a copy for you. Click below to download the 24-page PDF.
          </p>
          <a
            href={downloadUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            <Download className="h-4 w-4" />
            Download the guide
          </a>
          <p className="mt-4 text-xs text-slate-400">PDF · ~24 pages · no email confirmation needed</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60"
    >
      <h3 className="text-lg font-semibold text-slate-900">Get the free guide</h3>
      <p className="mt-1 text-sm text-slate-500">
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
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-60"
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

      <p className="mt-4 text-center text-xs text-slate-400">
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}
