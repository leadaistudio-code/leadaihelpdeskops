"use server";

import prisma from "@/lib/prisma";
import { CIO_GUIDE_SLUG } from "@/lib/guides";

type CaptureLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common free/personal inboxes — we ask for a *work* email on the form.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

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

  const emailDomain = email.split("@")[1] ?? "";
  if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
    return { ok: false, error: "Please use your work email so we can send the guide." };
  }

  try {
    const lead = await prisma.lead.create({
      data: { name, email, company, jobTitle, guide: CIO_GUIDE_SLUG, source },
      select: { id: true },
    });
    return { ok: true, leadId: lead.id };
  } catch (e) {
    console.error("captureLead failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
