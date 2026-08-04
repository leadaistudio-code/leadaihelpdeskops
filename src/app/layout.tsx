import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import AppShell from "@/components/AppShell";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from "next/script";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
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
        <body className={`${jakarta.variable} ${bricolage.variable} font-sans bg-slate-50 text-slate-900 dark:bg-[#080B11] dark:text-[#EAEEF5]`}>
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
