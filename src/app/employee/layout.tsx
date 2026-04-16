"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Banknote,
  Wallet,
  Menu,
  X,
  LogOut,
  Coffee,
  User
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { name: "My Profile", href: "/employee/profile", icon: User },
  { name: "My Attendance", href: "/employee/attendance", icon: CalendarDays },
  { name: "Leave Balance", href: "/employee/leaves", icon: Coffee },
  { name: "My Holidays", href: "/employee/holidays", icon: CalendarRange },
  { name: "Loan & Advance", href: "/employee/loans", icon: Wallet },
  { name: "Salary & Payslip", href: "/employee/salary", icon: Banknote },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState("Employee");
  const [companyName, setCompanyName] = useState("Portal");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/employee/me")
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          const shortName = data.name.split(" ").pop();
          setEmployeeName(shortName || data.name);
          if (data.companyName) setCompanyName(data.companyName);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/employee-logout", { method: "POST" });
    router.push("/employee-login");
    router.refresh();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/employee/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setIsPasswordModalOpen(false);
        setNewPassword("");
        alert("Password updated successfully!");
      } else {
        alert("Failed to update password.");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-indigo-900 border-r border-indigo-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-indigo-950/50 border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-inner shrink-0">
              <span className="text-white font-bold text-lg">{companyName.charAt(0)}</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white truncate pr-2">
              {companyName}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-indigo-200 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-4">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-x-3 rounded-xl p-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-indigo-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform ${
                    isActive ? "text-white scale-110" : "text-indigo-300 group-hover:text-white"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="px-4 py-6 border-t border-indigo-800/50 bg-indigo-950/20">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-x-3 rounded-xl p-3 text-sm font-medium text-indigo-200 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
            <div className="flex items-center gap-x-3 lg:gap-x-5">
              <div className="hidden sm:block text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm transition hover:bg-slate-200 hover:text-slate-900 cursor-pointer" onClick={() => setIsPasswordModalOpen(true)} title="Update Password">
                Welcome, <span className="text-indigo-600">{employeeName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
           {/* Decorative blurred background orb */}
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-20rem]" aria-hidden="true">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>

          <div className="w-full min-h-full pb-20">
            {children}
          </div>
        </main>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity" onClick={() => setIsPasswordModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Update Login Details</h3>
              <p className="text-sm text-slate-500 mt-1">Change your portal login password.</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <input 
                  type="text" 
                  placeholder="Enter at least 6 characters" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={isUpdatingPassword || newPassword.length < 6} className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50">
                  {isUpdatingPassword ? "Updating..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
