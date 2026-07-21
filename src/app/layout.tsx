import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import AppShell from "@/components/AppShell";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from "next/script";

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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LeadAIStudio",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "AI-driven IT service management platform featuring Service Desk, DEX, Knowledge base, Catalogue and Asset Management.",
  "url": "https://leadaistudio.ai"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${geistMono.variable} font-sans bg-[#080B11] text-slate-200`}>
          <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <AppShell>{children}</AppShell>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        </body>
      </html>
    </ClerkProvider>
  );
}
