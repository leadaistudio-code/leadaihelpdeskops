import { describe, it, expect, beforeEach } from "vitest";
import { sendEmail, notificationEmailHtml } from "@/lib/email";

describe("sendEmail (unconfigured)", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("no-ops and reports not sent when env is missing", async () => {
    const res = await sendEmail({ to: "x@example.com", subject: "Hi", html: "<p>hi</p>" });
    expect(res.sent).toBe(false);
  });
});

describe("notificationEmailHtml", () => {
  it("includes the title and body", () => {
    const html = notificationEmailHtml("Ticket resolved", "INC0001 is done");
    expect(html).toContain("Ticket resolved");
    expect(html).toContain("INC0001 is done");
  });
  it("renders a link button when a link is provided", () => {
    const html = notificationEmailHtml("Assigned", undefined, "/incidents/abc");
    expect(html).toContain("/incidents/abc");
    expect(html).toContain("View in app");
  });
});
