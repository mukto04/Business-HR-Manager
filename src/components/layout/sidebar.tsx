"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Coins,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Banknote,
  Receipt,
  X,
  Clock,
  ClipboardList
} from "lucide-react";
import { cn } from "@/utils/classnames";
import { useAsyncData } from "@/modules/shared/use-async-data";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/attendance/requests", label: "Manual Requests", icon: Clock },
  { href: "/attendance/report", label: "Attendance Report", icon: ClipboardList },
  { href: "/holidays", label: "Holidays", icon: CalendarDays },
  { href: "/leaves", label: "Leave Balance", icon: ShieldCheck },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/advance-salary", label: "Advance Salary", icon: Banknote },
  { href: "/salary", label: "Salary Structure", icon: Coins },
  { href: "/monthly-salary", label: "Monthly Salary", icon: Coins },
  { href: "/office-cost", label: "Office Cost", icon: Receipt }
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useAsyncData<{ companyName: string }>("/api/me", { companyName: "HR Portal" });

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={onClose} className="absolute right-4 top-6 lg:hidden text-slate-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
        <div className="border-b border-white/10 px-6 py-6">
          <h2 className="text-xl font-bold truncate" title={session?.companyName}>
            {session?.companyName || "HR Portal"}
          </h2>
        </div>

      <div className="flex-1 space-y-1 p-4">
        {links.map(({ href, label, icon: Icon }) => {
          // Prefix the link with company slug if available for professional branded URL
          const brandedHref = session?.slug ? `/${session.slug}-hr${href}` : href;
          const active = pathname === href || pathname === brandedHref;
          
          return (
            <Link
              key={href}
              href={brandedHref}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>

    </aside>
    </>
  );
}
