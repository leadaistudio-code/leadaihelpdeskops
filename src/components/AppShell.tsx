"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AIChatbot from "@/components/AIChatbot";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMarketingPage = pathname === "/" || pathname === "/login" || pathname === "/walkup" || pathname?.startsWith("/p/");

  if (isMarketingPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`fixed top-[88px] ${isCollapsed ? 'left-24' : 'left-72'} right-8 bottom-8 overflow-hidden rounded-2xl glass-panel flex flex-col transition-all duration-300`}>
        <div className="h-full w-full overflow-auto rounded-2xl custom-scrollbar relative">
          {/* Subtle noise/glow overlay inside the main container */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02)_0%,transparent_100%)]"></div>
          {children}
        </div>
      </main>
      <AIChatbot />
    </>
  );
}
