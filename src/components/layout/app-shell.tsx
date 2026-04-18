"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useState, useEffect } from "react";

const AUTH_ROUTES = ["/", "/login", "/employee-login", "/employee", "/setup", "/super-admin"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthPage = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`));

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    // Render login / public pages without any chrome
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
      <div className="lg:pl-72 print:pl-0">
        <div className="print:hidden">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
        <main className="p-4 md:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
