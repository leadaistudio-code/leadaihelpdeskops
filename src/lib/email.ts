import { logError } from "@/lib/observability";

// Transactional email via Resend's HTTP API (no SDK dependency). Gated on env:
// when RESEND_API_KEY / EMAIL_FROM are unset, it logs and no-ops so local dev
// and CI never fail — wiring is one env var away from live sending.
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.log(`[email:skipped] to=${opts.to} subject="${opts.subject}" (RESEND_API_KEY/EMAIL_FROM not set)`);
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      logError(new Error(`Resend ${res.status}: ${await res.text()}`), { to: opts.to });
      return { sent: false };
    }
    return { sent: true };
  } catch (e) {
    logError(e, { scope: "sendEmail", to: opts.to });
    return { sent: false };
  }
}

// Minimal branded wrapper so notification emails look consistent.
export function notificationEmailHtml(title: string, body: string | undefined, link?: string) {
  const url = link ? (process.env.APP_URL ?? "http://localhost:3000") + link : null;
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
    <div style="font-weight:800;font-size:18px;color:#4f46e5;margin-bottom:16px;">LeadAIStudio AIOps</div>
    <h2 style="font-size:18px;color:#0f172a;margin:0 0 8px;">${title}</h2>
    ${body ? `<p style="color:#475569;font-size:14px;line-height:1.6;">${body}</p>` : ""}
    ${url ? `<a href="${url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">View in app</a>` : ""}
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;">You can turn off these emails in your profile settings.</p>
  </div>`;
}
