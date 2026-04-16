"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Wallet, Banknote } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-amount";

export default function EmployeeLoansPage() {
  const [data, setData] = useState<{ loans: any[], advances: any[] }>({ loans: [], advances: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/loans")
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">Loans & Advances</h1>
        <p className="text-slate-500">Track your personal loans and advance salaries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loans Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Personal Loans</h2>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100" />)}
            </div>
          ) : data.loans.length > 0 ? (
            <div className="space-y-4">
              {data.loans.map((loan) => (
                <div key={loan.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Total Loan Amount</h3>
                      <div className="text-2xl font-bold text-slate-800"><CurrencyAmount amount={loan.loanAmount} /></div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider ${
                      loan.dueAmount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {loan.dueAmount > 0 ? "Active" : "Settled"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Paid Amount</p>
                      <div className="font-semibold text-emerald-600"><CurrencyAmount amount={loan.paidAmount} /></div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Due Amount</p>
                      <div className="font-semibold text-amber-600"><CurrencyAmount amount={loan.dueAmount} /></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-slate-500">EMI: </span>
                      <span className="font-medium text-slate-700 inline-flex items-center"><CurrencyAmount amount={loan.installmentAmount} />/mo</span>
                    </div>
                    {loan.startMonth && loan.startYear && (
                      <div>
                        <span className="text-slate-500">Started: </span>
                        <span className="font-medium text-slate-700">{format(new Date(loan.startYear, loan.startMonth - 1), "MMM yyyy")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
              No loan records found.
            </div>
          )}
        </div>

        {/* Advances Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Banknote className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Advance Salaries</h2>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100" />)}
            </div>
          ) : data.advances.length > 0 ? (
            <div className="space-y-4">
              {data.advances.map((advance) => (
                <div key={advance.id} className="bg-white flex items-center justify-between rounded-3xl p-6 shadow-sm border border-slate-100 transition hover:shadow-md">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">
                      {format(new Date(advance.year, advance.month - 1), "MMMM yyyy")}
                    </h3>
                    <div className="text-2xl font-bold text-slate-800"><CurrencyAmount amount={advance.amount} /></div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider flex items-center gap-1 ${
                      advance.isDeducted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {advance.isDeducted ? "Deducted" : "Pending Deduction"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
              No advance salary records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
