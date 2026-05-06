"use client";

import { useState } from "react";
import { 
  X, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Percent,
  Calendar,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { formatCurrency } from "@/utils/calculations";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  selectedIds: string[];
  employees: any[];
}

export function IncrementModal({ onClose, onSuccess, selectedIds, employees }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "PERCENT_TOTAL", // FIXED_AMOUNT, PERCENT_TOTAL, PERCENT_BASIC
    value: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    note: ""
  });

  const selectedEmployees = employees.filter(e => selectedIds.includes(e.id));
  
  // If no IDs passed, it's a "Global" mode (user can select in UI or we assume ALL)
  // But based on the page logic, it always has selected IDs or empty for bulk.
  const targetIds = selectedIds.length > 0 ? selectedIds : employees.filter(e => e.status === "ACTIVE").map(e => e.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value || Number(formData.value) <= 0) {
      toast.error(t("Please enter a valid increment value"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/salary-increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: targetIds,
          ...formData
        })
      });

      if (res.ok) {
        toast.success(t("Salary increment applied successfully"));
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.message || t("Failed to apply increment"));
      }
    } catch (err) {
      toast.error(t("An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-brand-50 flex items-center justify-center text-brand-600">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{t("Apply Salary Increment")}</h2>
              <p className="text-slate-500 text-sm font-medium">
                {selectedIds.length > 0 
                  ? t("Updating salary for {count} employees", { count: selectedIds.length })
                  : t("Applying increment to all active employees")
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 space-y-6">
          
          {/* Selected Employees Preview (Scrollable horizontal chips) */}
          {selectedEmployees.length > 0 && (
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Selected Employees")}</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
                   {selectedEmployees.map(e => (
                     <div key={e.id} className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                        {e.name}
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* Increment Type Selection */}
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Select Increment Type")}</label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "FIXED_AMOUNT", label: "Fixed Amount", icon: DollarSign },
                  { id: "PERCENT_TOTAL", label: "% of Total", icon: Percent },
                  { id: "PERCENT_BASIC", label: "% of Basic", icon: Percent },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${
                      formData.type === type.id 
                        ? "border-brand-600 bg-brand-50/50 text-brand-600 shadow-sm" 
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <type.icon className={`w-5 h-5 ${formData.type === type.id ? "text-brand-600" : "text-slate-400"}`} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t(type.label)}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             {/* Value Input */}
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {formData.type === "FIXED_AMOUNT" ? t("Amount (৳)") : t("Percentage (%)")}
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {formData.type === "FIXED_AMOUNT" ? "৳" : "%"}
                   </div>
                   <Input 
                      type="number"
                      placeholder="0.00"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="pl-10 h-14 rounded-2xl border-slate-200 text-lg font-black focus:ring-brand-500"
                      required
                   />
                </div>
             </div>

             {/* Effective Date */}
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Effective From")}</label>
                <div className="grid grid-cols-2 gap-2">
                   <select 
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                      className="h-14 rounded-2xl border-slate-200 bg-white px-4 text-sm font-bold focus:ring-brand-500 outline-none border"
                   >
                      {months.map((m, i) => (
                        <option key={m} value={i + 1}>{t(m)}</option>
                      ))}
                   </select>
                   <select 
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="h-14 rounded-2xl border-slate-200 bg-white px-4 text-sm font-bold focus:ring-brand-500 outline-none border"
                   >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                   </select>
                </div>
             </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Notes (Optional)")}</label>
             <textarea 
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder={t("e.g. Annual performance review...")}
                className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 focus:ring-brand-500 outline-none text-sm font-medium resize-none"
             />
          </div>

          {/* Warning Info */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
             <Info className="w-5 h-5 text-amber-600 shrink-0" />
             <p className="text-xs text-amber-800 leading-relaxed">
                {t("This change will update the Salary Structure for all selected employees. Future monthly salaries will be generated with these new values.")}
             </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 rounded-2xl h-14 font-black text-slate-500 hover:bg-slate-100"
          >
            {t("Cancel")}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] rounded-2xl h-14 bg-brand-600 hover:bg-brand-700 font-black shadow-lg shadow-brand-900/20"
          >
            {loading ? t("Applying...") : t("Confirm & Apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
