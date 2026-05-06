"use client";

import { useState } from "react";
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Percent,
  Calendar,
  Info,
  ChevronDown
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
    type: "PERCENT_TOTAL", 
    value: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    note: ""
  });

  const selectedEmployees = employees.filter(e => selectedIds.includes(e.id));
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

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-900/10">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{t("Apply Salary Increment")}</h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {selectedIds.length > 0 
                  ? t("Updating {count} employees", { count: selectedIds.length })
                  : t("All active employees")
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* Selected Preview */}
          {selectedEmployees.length > 0 && (
             <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Selected")}</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-100 max-h-20 overflow-y-auto">
                   {selectedEmployees.map(e => (
                     <div key={e.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-600">
                        {e.name}
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "FIXED_AMOUNT", label: "Fixed", icon: DollarSign },
              { id: "PERCENT_TOTAL", label: "% Total", icon: Percent },
              { id: "PERCENT_BASIC", label: "% Basic", icon: Percent },
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.id })}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                  formData.type === type.id 
                    ? "border-brand-600 bg-brand-50 text-brand-600 font-bold" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 text-[10px]"
                }`}
              >
                <type.icon className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-tight">{t(type.label)}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Value Input */}
             <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {formData.type === "FIXED_AMOUNT" ? t("Amount (৳)") : t("Percentage (%)")}
                </label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      {formData.type === "FIXED_AMOUNT" ? "৳" : "%"}
                   </div>
                   <Input 
                      type="number"
                      placeholder="0.00"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="pl-8 h-10 rounded-xl border-slate-200 text-xs font-bold focus:ring-brand-500"
                      required
                   />
                </div>
             </div>

             {/* Effective Date */}
             <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Effective From")}</label>
                <div className="grid grid-cols-2 gap-1.5">
                   <div className="relative">
                      <select 
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-[10px] font-bold focus:ring-brand-500 outline-none appearance-none"
                      >
                        {months.map((m, i) => (
                          <option key={m} value={i + 1}>{t(m)}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                   </div>
                   <div className="relative">
                      <select 
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-[10px] font-bold focus:ring-brand-500 outline-none appearance-none"
                      >
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("Notes")}</label>
             <textarea 
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder={t("Performance review note...")}
                className="w-full min-h-[60px] p-3 rounded-xl border border-slate-200 focus:ring-brand-500 outline-none text-[10px] font-medium resize-none bg-slate-50/30"
             />
          </div>

          <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-100 flex gap-2">
             <Info className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
             <p className="text-[9px] text-brand-800 leading-relaxed font-medium">
                {t("This will update the Salary Structure for future monthly salaries.")}
             </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-50 flex gap-2 bg-slate-50/30">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 rounded-xl h-9 text-[10px] font-bold text-slate-500 hover:bg-slate-100"
          >
            {t("Cancel")}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[1.5] rounded-xl h-9 bg-brand-600 hover:bg-brand-700 text-[10px] font-black text-white shadow-md shadow-brand-900/10"
          >
            {loading ? t("Applying...") : t("Confirm & Apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
