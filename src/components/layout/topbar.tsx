"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Search, Cake, CalendarRange, LogOut, Fingerprint, ShieldCheck } from "lucide-react";
import { useAsyncData } from "@/modules/shared/use-async-data";
import { useRouter } from "next/navigation";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { data, loading, refresh } = useAsyncData<{ 
    notifications: Array<{ id: string; type: string; title: string; subtitle: string; date: string }>,
    subscription: { daysLeft: number, endDate: string, adminUsername: string, adminPassword?: string } | null
  }>("/api/notifications", { notifications: [], subscription: null });
  
  const notifications = data?.notifications || [];
  const subscription = data?.subscription;
  
  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh({ silent: true });
    }, 30000); 
    return () => clearInterval(interval);
  }, [refresh]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden">
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
          <div className="hidden flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex lg:max-w-xl">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search module data..." 
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-100"
            >
              <Bell className="h-5 w-5 text-slate-700" />
              {!loading && notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg z-50">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {loading ? (
                    <p className="p-4 text-center text-sm text-slate-500">Checking...</p>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-500">No birthdays or anniversaries today or tomorrow.</p>
                  ) : (
                    notifications.map((notif) => (
                      <button 
                        key={notif.id} 
                        onClick={() => {
                          setShowNotifications(false);
                          if (notif.type === "ATTENDANCE_REQUEST") {
                            router.push("/attendance/requests");
                          }
                        }}
                        className="flex w-full text-left gap-3 rounded-lg p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          {notif.type === "BIRTHDAY" ? (
                            <Cake className="h-4 w-4" />
                          ) : notif.type === "ATTENDANCE_REQUEST" ? (
                            <Fingerprint className="h-4 w-4" />
                          ) : notif.type === "SUBSCRIPTION" ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <CalendarRange className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-500">{notif.subtitle}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 transition-colors text-left"
            >
              <div>
                <p className="font-semibold text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">HR Manager</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                <div className="p-1">
                  <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">Admin Account</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Authorized Management</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {subscription && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Login Access</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Username:</span>
                            <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">
                              {subscription.adminUsername}
                            </code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Password:</span>
                            <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">
                              {subscription.adminPassword}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {subscription && (
                      <div className="px-1">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription</p>
                           <span className={`text-[10px] font-bold ${subscription.daysLeft > 7 ? "text-green-600" : "text-red-500"}`}>
                             {subscription.daysLeft} Days Left
                           </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div 
                            className={`h-full transition-all ${subscription.daysLeft > 7 ? 'bg-green-500' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(100, (subscription.daysLeft / 30) * 100)}%` }}
                           />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 italic">
                          Expires: {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-600 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
