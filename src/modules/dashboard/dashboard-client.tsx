"use client";

import { useState } from "react";
import { BriefcaseBusiness, Cake, CalendarRange, Landmark, WalletCards, CalendarClock, PiggyBank, FileDown, CalendarDays } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, Tooltip, Bar } from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { useAsyncData } from "@/modules/shared/use-async-data";
import { LoadingState } from "@/modules/shared/loading-state";
import { ErrorState } from "@/modules/shared/error-state";
import { DashboardSummary } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/calculations";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const emptySummary: DashboardSummary = {
  totalEmployees: 0,
  birthdaysThisMonth: 0,
  anniversariesThisMonth: 0,
  holidaysThisMonth: 0,
  salaryExpenseSummary: 0,
  pendingLeaves: 0,
  pendingLoans: 0,
  currentMonthOfficeCost: 0,
  birthdayEmployees: [],
  anniversaryEmployees: [],
  expenseChart: []
};

export function DashboardClient() {
  const router = useRouter();
  const { data, loading, error } = useAsyncData<DashboardSummary>("/api/dashboard", emptySummary);
  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const handleGenerateReport = () => {
    router.push(`/reports/full-monthly?month=${selectedMonth}&year=${selectedYear}&print=true`);
    setReportModalOpen(false);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Management Dashboard"
        subtitle="Professional SaaS-style overview for employees, payroll, leave, loans and holidays."
        actions={
          <Button variant="secondary" onClick={() => setReportModalOpen(true)} className="gap-2 bg-white hover:bg-slate-50 transition-all border-slate-200">
            <FileDown className="h-4 w-4" /> Download Monthly Report
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={data.totalEmployees} icon={BriefcaseBusiness} helper="All active records" />
        <StatCard title="Birthdays This Month" value={data.birthdaysThisMonth} icon={Cake} helper="Auto-detected from DOB" />
        <StatCard title="Anniversaries This Month" value={data.anniversariesThisMonth} icon={CalendarRange} helper="Based on joining date" />
        <StatCard title="Holidays This Month" value={data.holidaysThisMonth} icon={CalendarClock} helper="Company holidays" />
        <StatCard title="Running Month Salary" value={formatCurrency(data.salaryExpenseSummary)} icon={WalletCards} helper="Payable for current month" />
        <StatCard title="Office Cost (This Month)" value={formatCurrency(data.currentMonthOfficeCost)} icon={Landmark} helper="Running month total expense" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr_1fr]">
        <Card className="p-5">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">Expense summary</h3>
            <p className="text-sm text-slate-500">Quick visual of financial items in the dashboard.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expenseChart}>
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="amount" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-bold text-slate-900">Birthday list</h3>
          <p className="mb-4 text-sm text-slate-500">Employees with birthdays this month</p>
          <div className="space-y-3">
            {data.birthdayEmployees.length ? (
              data.birthdayEmployees.map((employee) => (
                <div key={employee.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{employee.name}</p>
                  <p className="text-sm text-slate-500">{format(new Date(employee.date), "dd MMM")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No birthdays this month.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-bold text-slate-900">Anniversary list</h3>
          <p className="mb-4 text-sm text-slate-500">Employees with anniversaries this month</p>
          <div className="space-y-3">
            {data.anniversaryEmployees.length ? (
              data.anniversaryEmployees.map((employee) => (
                <div key={employee.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{employee.name}</p>
                  <p className="text-sm text-slate-500">{format(new Date(employee.date), "dd MMM")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No anniversaries this month.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Report Selector Modal */}
      <Modal 
        open={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        title="Full Monthly Report"
        description="Select a month to generate a consolidated PDF report."
      >
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Month</label>
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Year</label>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport} className="gap-2">
               <CalendarDays className="h-4 w-4" /> View & Print Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
