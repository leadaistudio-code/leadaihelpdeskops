"use server";

import prisma from "@/lib/prisma";
import { CIO_GUIDE_SLUG } from "@/lib/guides";
import { sendEmail } from "@/lib/email";
import { logError } from "@/lib/observability";

// A guide download is a warm lead, and until now it landed only in the database
// where nobody was looking. Same destination as the demo form.
async function notifyGuideLead(lead: {
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  source: string | null;
}) {
  const rows: Array<[string, string]> = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Company", lead.company],
    ["Job title", lead.jobTitle],
    ["Source", lead.source ?? "—"],
  ];
  const esc = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  await sendEmail({
    to: process.env.LEAD_NOTIFY_EMAIL ?? "aryan9868@gmail.com",
    subject: `Guide download — ${lead.name} (${lead.company})`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;padding:24px;">
      <h2 style="font-size:18px;color:#0a0a0a;">CIO guide downloaded</h2>
      <table style="font-size:14px;color:#3a3a3c;">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#6b6b6d;">${k}</td><td style="color:#0a0a0a;">${esc(v)}</td></tr>`
        )
        .join("")}</table></div>`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    replyTo: /[\r\n]/.test(lead.email) ? undefined : lead.email,
  });
}

type CaptureLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// This form used to reject free inboxes (gmail, outlook, icloud…) to force a
// work address. It was turning away real prospects — founders and IT leads at
// small firms routinely run on gmail — and the guide is a top-of-funnel asset
// whose job is reach, not qualification. Qualification happens later, on the
// demo request. Capture the lead; judge it afterwards.

// Capture a marketing lead in exchange for a gated download. Returns the lead
// id, which the client then uses as the one-time-ish token to fetch the PDF.
export async function captureLead(formData: FormData): Promise<CaptureLeadResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || null;

  if (!name || name.length < 2) return { ok: false, error: "Please enter your full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!company) return { ok: false, error: "Please enter your company." };
  if (!jobTitle) return { ok: false, error: "Please enter your job title." };

  try {
    const lead = await prisma.lead.create({
      data: { name, email, company, jobTitle, guide: CIO_GUIDE_SLUG, source },
      select: { id: true },
    });

    // Tell sales a guide was downloaded. Deliberately not awaited: the visitor's
    // download must not wait on an SMTP round trip, and a mail failure must not
    // cost us a lead that is already safely in the database.
    notifyGuideLead({ name, email, company, jobTitle, source }).catch((e) =>
      logError(e, { scope: "notifyGuideLead" })
    );

    return { ok: true, leadId: lead.id };
  } catch (e) {
    logError(e, { scope: "captureLead", email });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
