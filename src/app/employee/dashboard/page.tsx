"use client";

import { useEffect, useState } from "react";
import { Coffee, Wallet, Banknote, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { CurrencyAmount } from "@/components/ui/currency-amount";

export default function EmployeeDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/dashboard")
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-32 bg-indigo-100/50 rounded-3xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-indigo-50/50 rounded-3xl"></div>)}
      </div>
    </div>;
  }

  const employee = data?.employee;
  const leaveBalance = employee?.leaveBalances?.[0];
  const activeLoans = employee?.loans || [];
  const currentMonth = format(new Date(), "MMMM yyyy");

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {employee?.name}!</h1>
        <p className="text-indigo-100 text-lg">{employee?.designation} | {employee?.department}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Stat */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative group overflow-hidden">
          <div className="flex-1">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-slate-500 font-medium mb-1">Present Details</h3>
            <p className="text-3xl font-bold text-slate-800">{data?.stats?.presentDays || 0} <span className="text-sm font-normal text-slate-500">days</span></p>
            <p className="text-sm text-slate-400 mt-2">In {currentMonth}</p>
          </div>
          <Link href="/employee/attendance" className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* Leave Stat */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative group overflow-hidden">
          <div className="flex-1">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
              <Coffee className="h-6 w-6" />
            </div>
            <h3 className="text-slate-500 font-medium mb-1">Leave Balance</h3>
            <p className="text-3xl font-bold text-slate-800">{leaveBalance ? leaveBalance.dueLeave : 0} <span className="text-sm font-normal text-slate-500">remaining</span></p>
            <p className="text-sm text-slate-400 mt-2">Out of {leaveBalance ? leaveBalance.totalLeave : 0} total</p>
          </div>
          <Link href="/employee/leaves" className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* Loan Stat */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative group overflow-hidden">
          <div className="flex-1">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-slate-500 font-medium mb-1">Active Loan Due</h3>
            <div className="text-3xl font-bold text-slate-800">
              <CurrencyAmount amount={activeLoans.reduce((acc: number, loan: any) => acc + loan.dueAmount, 0)} />
            </div>
            <p className="text-sm text-slate-400 mt-2">{activeLoans.length} active queries</p>
          </div>
          <Link href="/employee/loans" className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* Advance Salary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative group overflow-hidden">
          <div className="flex-1">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
              <Banknote className="h-6 w-6" />
            </div>
            <h3 className="text-slate-500 font-medium mb-1">Advance Taken</h3>
            <div className="text-3xl font-bold text-slate-800">
              <CurrencyAmount amount={employee?.advances?.length ? employee.advances[0].amount : 0} />
            </div>
            <p className="text-sm text-slate-400 mt-2">Will deduct next salary</p>
          </div>
          <Link href="/employee/salary" className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            View Salary <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Upcoming Holidays</h2>
          {data?.upcomingHolidays?.length > 0 ? (
            <div className="space-y-4">
              {data.upcomingHolidays.map((holiday: any) => (
                <div key={holiday.id} className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold uppercase">{format(new Date(holiday.date), "MMM")}</span>
                    <span className="text-lg font-bold leading-none">{format(new Date(holiday.date), "dd")}</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-slate-800">{holiday.name}</p>
                    <p className="text-sm text-slate-500">{holiday.totalDays} Day{holiday.totalDays > 1 ? "s" : ""} Off</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No upcoming holidays scheduled yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
