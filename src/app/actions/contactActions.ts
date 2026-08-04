"use server";

import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

type DemoRequestResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where "Book a demo" / "Contact us" submissions land. Overridable per
// deployment without a code change; the fallback is the address sales actually
// watches, so an unset env var never silently drops a lead.
const NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL ?? "aryan9868@gmail.com";

const COMPANY_SIZES = ["1-500 Employees", "500-2000 Employees", "2000+ Employees"];

// Form input is rendered into an HTML email, so it is untrusted markup until
// escaped — a `<script>` or a stray tag in a message must not become live HTML
// in the inbox that reads it.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Header injection guard: a newline in the address would let a submitter append
// arbitrary headers to the outbound message.
function safeReplyTo(email: string) {
  return /[\r\n]/.test(email) ? undefined : email;
}

export async function submitDemoRequest(formData: FormData): Promise<DemoRequestResult> {
  // Honeypot: a hidden field no human fills in. Bots complete every input they
  // find, so a non-empty value means "drop it" — silently, so the bot learns
  // nothing from the response.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const companySizeRaw = String(formData.get("companySize") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!firstName) return { ok: false, error: "Please enter your first name." };
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (message.length > 5000) {
    return { ok: false, error: "Please keep your message under 5000 characters." };
  }
  const companySize = COMPANY_SIZES.includes(companySizeRaw) ? companySizeRaw : "Not specified";

  // Public, unauthenticated, and it sends mail — so it is rate limited by IP.
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimit(`demo-request:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Too many requests. Please try again later, or email us directly." };
  }

  const name = [firstName, lastName].filter(Boolean).join(" ");
  const referer = hdrs.get("referer") ?? "unknown";

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Company size", companySize],
    ["Message", message || "—"],
    ["Submitted from", referer],
  ];

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="font-size:18px;color:#0a0a0a;margin:0 0 16px;">New demo request</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3a3a3c;">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:8px 12px 8px 0;color:#6b6b6d;vertical-align:top;white-space:nowrap;">${label}</td>
          <td style="padding:8px 0;color:#0a0a0a;">${escapeHtml(value).replace(/\n/g, "<br>")}</td>
        </tr>`
        )
        .join("")}
    </table>
  </div>`;

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  const { sent } = await sendEmail({
    to: NOTIFY_TO,
    subject: `Demo request — ${name} (${email})`,
    html,
    text,
    replyTo: safeReplyTo(email),
  });

  if (!sent) {
    // The submission is already lost to the visitor at this point, so log the
    // whole payload: a line in the server log is recoverable, a discarded lead
    // is not. Then say so, rather than showing a success state for a message
    // that never left the building.
    logError(new Error("demo request email not sent"), { scope: "submitDemoRequest", lead: text });
    return {
      ok: false,
      error: "We couldn't send your request just now. Please email enterprise@leadaistudio.ai directly.",
    };
  }

  return { ok: true };
}
