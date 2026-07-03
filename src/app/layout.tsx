import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import AppShell from "@/components/AppShell";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
// Characterful grotesk for display headings — paired with Jakarta for body.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "LeadAIStudio — One Solution for the Entire IT Helpdesk",
    template: "%s · LeadAIStudio",
  },
  description:
    "AI Service Desk, Digital Employee Experience, Knowledge, Catalogue, and Asset Management — unified on a single AI-driven IT service management platform.",
  applicationName: "LeadAIStudio AIOps",
  keywords: [
    "IT helpdesk",
    "IT service management",
    "ITSM",
    "AI service desk",
    "digital employee experience",
    "asset management",
    "AIOps",
  ],
  openGraph: {
    title: "LeadAIStudio — One Solution for the Entire IT Helpdesk",
    description:
      "Replace your tangle of disconnected IT tools with one intelligent platform.",
    type: "website",
    siteName: "LeadAIStudio AIOps",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadAIStudio — One Solution for the Entire IT Helpdesk",
    description:
      "AI Service Desk, DEX, Knowledge, Catalogue & Asset Management on one platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${jakarta.variable} ${bricolage.variable} font-sans bg-aurora text-slate-200`}>
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
