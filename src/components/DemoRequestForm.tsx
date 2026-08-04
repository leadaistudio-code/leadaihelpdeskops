"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitDemoRequest } from "@/app/actions/contactActions";

const INPUT_CLASS =
  "w-full px-4 py-2 border border-[#e5e5e5] rounded-lg focus:ring-2 focus:ring-[#00d4a4] focus:border-[#00d4a4] focus:outline-none";
const LABEL_CLASS = "block text-sm font-semibold text-[#3a3a3c] mb-1";

// "Request a Demo" on /p/contact. Submissions are emailed to sales by the
// server action — see src/app/actions/contactActions.ts.
export default function DemoRequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const result = await submitDemoRequest(new FormData(e.currentTarget));
    if (result.ok) {
      setStatus("sent");
    } else {
      setError(result.error);
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-white p-8 border border-[#e5e5e5] rounded-xl shadow-lg flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00d4a4]/10">
          <CheckCircle2 className="h-7 w-7 text-[#00926f]" />
        </div>
        <h3 className="text-2xl font-bold text-[#0a0a0a]">Request received</h3>
        <p className="mt-2 max-w-sm text-[#3a3a3c]">
          Thanks — our enterprise team will be in touch within one business day. If it&apos;s urgent,
          call <span className="whitespace-nowrap">+1 (800) 555-0199</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 border border-[#e5e5e5] rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold text-[#0a0a0a] mb-6">Request a Demo</h3>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS} htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" type="text" required autoComplete="given-name" className={INPUT_CLASS} placeholder="John" />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" type="text" autoComplete="family-name" className={INPUT_CLASS} placeholder="Doe" />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="email">Work Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={INPUT_CLASS} placeholder="john@company.com" />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="companySize">Company Size</label>
          <select id="companySize" name="companySize" defaultValue="1-500 Employees" className={INPUT_CLASS}>
            <option>1-500 Employees</option>
            <option>500-2000 Employees</option>
            <option>2000+ Employees</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="message">How can we help?</label>
          <textarea id="message" name="message" maxLength={5000} className={`${INPUT_CLASS} h-24`} placeholder="Tell us about your IT challenges..."></textarea>
        </div>

        {/* Honeypot — hidden from people, filled in by bots. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-[#d45656]/10 px-3 py-2 text-sm text-[#d45656]">{error}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-3 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors mt-4 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Submit Request"
          )}
        </button>

        <p className="text-center text-xs text-[#6b6b6d]">
          We&apos;ll only use your details to respond to this request.
        </p>
      </form>
    </div>
  );
}
