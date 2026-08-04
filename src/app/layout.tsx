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
    default: "LeadAIStudio — Digital Employee Experience that ends the ticket",
    template: "%s · LeadAIStudio",
  },
  description:
    "A DEX platform that watches every endpoint, predicts failures hours ahead, and heals them autonomously — so the ticket is never filed. Reactive IT becomes proactive, with a full service desk behind it for what's left.",
  applicationName: "LeadAIStudio DEX",
  keywords: [
    "digital employee experience",
    "DEX platform",
    "proactive IT support",
    "ticket deflection",
    "endpoint health monitoring",
    "autonomous remediation",
    "AIOps",
    "IT service management",
  ],
  openGraph: {
    title: "LeadAIStudio — Digital Employee Experience that ends the ticket",
    description:
      "Stop resolving tickets faster. Stop creating them. Predictive endpoint telemetry and autonomous remediation, with a service desk for the rest.",
    type: "website",
    siteName: "LeadAIStudio DEX",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadAIStudio — Digital Employee Experience that ends the ticket",
    description:
      "Predict endpoint failure hours ahead and heal it autonomously. From reactive IT to proactive.",
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
  "description": "Digital Employee Experience platform that predicts endpoint failures and remediates them autonomously, eliminating tickets before they are raised. Includes AI service desk, knowledge, catalogue and asset management.",
  "url": "https://leadaistudio.com"
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
