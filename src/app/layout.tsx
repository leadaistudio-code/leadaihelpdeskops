import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "ITSM Platform",
  description: "AI-Driven IT Service Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} font-sans bg-aurora text-slate-200`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
