"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Banknote, ReceiptText, ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { generatePayslipPDF } from "@/lib/payslip-generator";

export default function EmployeeSalaryPage() {
  const [data, setData] = useState<{ salaryStructure: any, monthlySalaries: any[] }>({
    salaryStructure: null,
    monthlySalaries: []
  });
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/employee/salary").then(res => res.json()),
      fetch("/api/employee/me").then(res => res.json())
    ]).then(([salaryData, meData]) => {
      setData(salaryData);
      setEmployeeInfo(meData);
      setLoading(false);
    });
  }, []);

  const handleDownload = async (salary: any) => {
    if (!employeeInfo) return;
    setDownloadingId(salary.id);
    try {
      await generatePayslipPDF(employeeInfo, salary);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">Salary & Payslips</h1>
        <p className="text-slate-500">View your salary structure and monthly payslips</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-white rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-20 bg-white rounded-2xl"></div>
            <div className="h-20 bg-white rounded-2xl"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Salary Structure Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Banknote className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Current Salary Structure</h2>
            </div>
            
            {data.salaryStructure ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50">
                  <p className="text-sm font-medium text-indigo-600/80 mb-2">Total Gross Salary</p>
                  <div className="text-4xl font-bold text-indigo-900"><CurrencyAmount amount={data.salaryStructure.totalSalary} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <p className="text-sm text-slate-500 mb-1">Basic Salary</p>
                    <div className="font-semibold text-slate-800"><CurrencyAmount amount={data.salaryStructure.basicSalary} /></div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <p className="text-sm text-slate-500 mb-1">House Rent (HRA)</p>
                    <div className="font-semibold text-slate-800"><CurrencyAmount amount={data.salaryStructure.hra} /></div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <p className="text-sm text-slate-500 mb-1">Medical</p>
                    <div className="font-semibold text-slate-800"><CurrencyAmount amount={data.salaryStructure.medicalAllowance} /></div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <p className="text-sm text-slate-500 mb-1">Travel</p>
                    <div className="font-semibold text-slate-800"><CurrencyAmount amount={data.salaryStructure.travelAllowance} /></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Your salary structure has not been configured yet.</p>
            )}
          </div>

          {/* Monthly Payslips Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-indigo-500" />
              Monthly Payslips history
            </h2>

            {data.monthlySalaries.length > 0 ? (
              data.monthlySalaries.map((salary) => (
                <div key={salary.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                  <div 
                    onClick={() => toggleExpand(salary.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <span className="font-bold text-indigo-600">{format(new Date(salary.year, salary.month - 1), "MMM")}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{format(new Date(salary.year, salary.month - 1), "MMMM yyyy")}</h3>
                        <p className="text-sm text-slate-500">Working Days: {salary.workingDays}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 ml-[4.5rem] sm:ml-0">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Net Paid</p>
                        <div className="font-bold text-emerald-600 text-lg"><CurrencyAmount amount={salary.totalSalaryPaid} /></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          salary.isPaid && !salary.isHeld ? "bg-emerald-100 text-emerald-700" :
                          salary.isHeld ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {salary.isHeld ? "On Hold" : salary.isPaid ? "Paid" : "Pending"}
                        </span>
                        {expandedId === salary.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {expandedId === salary.id && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Earnings</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600"><span>Basic Salary</span> <CurrencyAmount amount={salary.basicSalary} /></div>
                            <div className="flex justify-between text-slate-600"><span>HRA</span> <CurrencyAmount amount={salary.hra} /></div>
                            <div className="flex justify-between text-slate-600"><span>Medical Setup</span> <CurrencyAmount amount={salary.medicalAllowance} /></div>
                            <div className="flex justify-between text-slate-600"><span>Travel Allowance</span> <CurrencyAmount amount={salary.travelAllowance} /></div>
                            <div className="flex justify-between text-emerald-600 font-medium pt-2 border-t border-slate-200"><span>Gross Earnings</span> <CurrencyAmount amount={salary.totalSalary} /></div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Deductions</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600"><span>Advance Recovery</span> <CurrencyAmount amount={salary.advanceSalaryAmount} /></div>
                            <div className="flex justify-between text-slate-600"><span>Loan Adjustment</span> <CurrencyAmount amount={salary.loanAdjustAmount} /></div>
                            {salary.leaveDeductionAmount > 0 && (
                              <div className="flex justify-between text-rose-500 italic">
                                <span>Leave Deduction</span>
                                <CurrencyAmount amount={salary.leaveDeductionAmount} />
                              </div>
                            )}
                            <div className="flex justify-between text-red-600 font-medium pt-2 border-t border-slate-200">
                              <span>Total Deductions</span> 
                              <CurrencyAmount amount={(salary.advanceSalaryAmount + salary.loanAdjustAmount + (salary.leaveDeductionAmount || 0)).toFixed(2)} />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-indigo-100 flex flex-col justify-center text-center">
                          <p className="text-slate-500 mb-1">Final Payable Salary</p>
                          <div className="text-3xl font-bold text-indigo-900 mb-4"><CurrencyAmount amount={salary.payableSalary} /></div>
                          <div className="mt-auto">
                            <button 
                              onClick={() => handleDownload(salary)}
                              disabled={downloadingId === salary.id}
                              className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition text-sm font-medium disabled:opacity-50"
                            >
                              {downloadingId === salary.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              {downloadingId === salary.id ? "Generating PDF..." : "Download Payslip PDF"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-500">
                No salary records found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
