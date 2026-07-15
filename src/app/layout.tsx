import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import AppShell from "@/components/AppShell";

// Mintlify design language: Inter carries every UI surface (body, headings,
// labels, buttons); Geist Mono is used surgically for code and type signatures.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

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
      <html lang="en">
        <body className={`${inter.variable} ${geistMono.variable} font-sans bg-[#f7f7f7] text-[#0a0a0a]`}>
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
