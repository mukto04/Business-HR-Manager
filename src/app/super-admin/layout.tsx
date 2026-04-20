"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Globe, 
  Settings, 
  LogOut,
  ChevronRight,
  Monitor
} from "lucide-react";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If it's the login page, don't show the sidebar
  if (pathname === "/super-admin/login") {
    return <>{children}</>;
  }

  const menuItems = [
    {
      title: "Service Controller",
      icon: <Monitor className="w-5 h-5" />,
      href: "/super-admin/tenants",
      description: "Manage instances & DBs"
    },
    {
      title: "Landing Page Controller",
      icon: <Globe className="w-5 h-5" />,
      href: "/super-admin/landing-controller",
      description: "Update content & images"
    },
    {
      title: "System Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/super-admin/settings",
      description: "Change admin password"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Sidebar */}
      <aside 
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col transition-all duration-300 z-50`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-lg font-bold text-white leading-tight">Master Controller</h1>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Root Access Only</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={i} 
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                  isActive 
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={`${isActive ? "text-white" : "text-slate-500 group-hover:text-red-500"}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-bold truncate">{item.title}</div>
                    <div className={`text-[10px] truncate ${isActive ? "text-red-100" : "text-slate-500"}`}>
                      {item.description}
                    </div>
                  </div>
                )}
                {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-white/5 transition-all"
           >
             <Settings className="w-5 h-5" />
             {!isCollapsed && <span className="text-sm font-medium">Collapse Sidebar</span>}
           </button>
           <Link 
             href="/super-admin/login"
             className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold"
           >
             <LogOut className="w-5 h-5" />
             {!isCollapsed && <span className="text-sm">Sign Out System</span>}
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
