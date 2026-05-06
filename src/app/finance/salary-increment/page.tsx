"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Search, 
  History, 
  UserPlus, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Plus,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAsyncData } from "@/modules/shared/use-async-data";
import { useTranslation } from "@/hooks/use-translation";
import { formatCurrency } from "@/utils/calculations";
import { format } from "date-fns";
import { toast } from "sonner";
import { useDialog } from "@/components/ui/dialog-provider";
import { IncrementModal } from "./components/increment-modal";

export default function SalaryIncrementPage() {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [tab, setTab] = useState<"ACTIVE" | "DEACTIVE">("ACTIVE");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const { data: employees, loading, refresh } = useAsyncData<any[]>(
    `/api/salary-increment?status=${tab}`,
    []
  );

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const handleDeactivate = async (id: string) => {
    const ok = await dialog.confirm(t("Deactivate Employee"), t("Are you sure you want to move this employee to history? They will be marked as DEACTIVE."));
    if (!ok) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success(t("Employee moved to history"));
        refresh();
      }
    } catch (err) {
      toast.error(t("Failed to deactivate"));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "ACTIVE" })
      });
      if (res.ok) {
        toast.success(t("Employee restored to active list"));
        refresh();
      }
    } catch (err) {
      toast.error(t("Failed to activate"));
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            {t("Salary Increment Management")}
          </h1>
          <p className="text-slate-500 text-sm">{t("Track and manage employee salary evolution and increments")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              setSelectedEmployees([]);
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-brand-600 hover:bg-brand-700 h-11 px-6 shadow-lg shadow-brand-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("Bulk Increment")}
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setTab("ACTIVE")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition ${tab === "ACTIVE" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t("Active Employees")}
          </button>
          <button
            onClick={() => setTab("DEACTIVE")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${tab === "DEACTIVE" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <History className="w-4 h-4" />
            {t("History (Deactive)")}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={t("Search by name or ID...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl border-slate-200 h-11 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-6 rounded-[2rem] border-none bg-brand-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-900/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-600/60">{t("Total Active")}</p>
              <h3 className="text-2xl font-black text-brand-900">{employees.filter(e => e.status === "ACTIVE").length}</h3>
            </div>
         </Card>
         {/* Add more stats if needed */}
      </div>

      {/* Main Table */}
      <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    checked={selectedEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                    onChange={selectAll}
                  />
                </th>
                <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t("Employee Details")}</th>
                <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t("Starting Salary")}</th>
                <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t("Increments")}</th>
                <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t("Current Salary")}</th>
                <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-5"><div className="h-12 bg-slate-100 rounded-2xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <TrendingUp className="w-12 h-12 text-slate-200" />
                      <p>{t("No employees found.")}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => {
                const startSalary = emp.increments?.length > 0 
                  ? emp.increments[emp.increments.length - 1].oldSalary 
                  : emp.salaryStructure?.totalSalary || 0;
                
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleSelection(emp.id)}
                      />
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{emp.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-slate-700">{formatCurrency(startSalary)}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{t("Joined")} {format(new Date(emp.joiningDate), "MMM yyyy")}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {emp.increments?.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">{t("No increments yet")}</span>
                        ) : (
                          emp.increments.slice(0, 3).map((inc: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                              +{formatCurrency(inc.amount)}
                            </span>
                          ))
                        )}
                        {emp.increments?.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{emp.increments.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-lg font-black text-brand-600">{formatCurrency(emp.salaryStructure?.totalSalary || 0)}</p>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployees([emp.id]);
                            setIsModalOpen(true);
                          }}
                          className="rounded-xl hover:bg-brand-50 hover:text-brand-600 font-bold text-[10px] uppercase"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {t("Increment")}
                        </Button>
                        
                        {tab === "ACTIVE" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(emp.id)}
                            className="rounded-xl hover:bg-red-50 hover:text-red-600 font-bold text-[10px] uppercase"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {t("Deactivate")}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(emp.id)}
                            className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 font-bold text-[10px] uppercase"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t("Activate")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sticky Selection Bar */}
      {selectedEmployees.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 border-r border-white/10 pr-8">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center font-black">
              {selectedEmployees.length}
            </div>
            <p className="text-sm font-bold tracking-tight">{t("Employees Selected")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl bg-brand-600 hover:bg-brand-700 font-black h-11 px-8"
            >
              {t("Apply Bulk Increment")}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedEmployees([])}
              className="rounded-2xl hover:bg-white/10 text-white font-bold h-11"
            >
              {t("Cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <IncrementModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedEmployees([]);
            refresh();
          }}
          selectedIds={selectedEmployees}
          employees={employees}
        />
      )}
    </div>
  );
}
