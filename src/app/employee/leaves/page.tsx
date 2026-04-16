"use client";

import { useState, useEffect } from "react";
import { Coffee, Calendar } from "lucide-react";

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/leaves")
      .then(res => res.json())
      .then(data => {
        setLeaves(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Leave Balance</h1>
        <p className="text-slate-500">Overview of your yearly assigned and remaining leaves</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="animate-pulse h-48 bg-white rounded-3xl" />)
        ) : leaves.length > 0 ? (
          leaves.map((leaveBalance) => (
            <div key={leaveBalance.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5">
                <Coffee className="h-32 w-32 -mt-8 -mr-8" />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-slate-500 font-medium">Year</h3>
                  <p className="text-xl font-bold text-slate-800">{leaveBalance.year}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Leaves</p>
                  <p className="text-2xl font-bold text-slate-800">{leaveBalance.totalLeave}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Remaining Due</p>
                  <p className={`text-2xl font-bold ${leaveBalance.dueLeave < 3 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {leaveBalance.dueLeave}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Used: {leaveBalance.totalLeave - leaveBalance.dueLeave}</span>
                  <span>Total: {leaveBalance.totalLeave}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      (leaveBalance.totalLeave - leaveBalance.dueLeave) / leaveBalance.totalLeave > 0.8 
                        ? 'bg-red-500' 
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${((leaveBalance.totalLeave - leaveBalance.dueLeave) / leaveBalance.totalLeave) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
            No leave balances found for your account.
          </div>
        )}
      </div>
    </div>
  );
}
