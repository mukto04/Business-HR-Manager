"use client";

import { useState, useEffect, useMemo } from "react";
import { format, getDaysInMonth } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getJson, sendJson } from "@/lib/http";
import { Select } from "@/components/ui/select";
import { Save, Check, CloudUpload } from "lucide-react";
import { useRef } from "react";

const monthMap: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
};

// Numeric fields that must always be stored as numbers
const NUMERIC_FIELDS = new Set([
  "payAmount", "bazarCost", "extraCost", "deposit",
  "recurringCost", "capitalCost"
]);

type RowData = {
  day: number;
  date: Date;
  payAmount: number;
  bazarCost: number;
  details: string;
  extraCost: number;
  extraDetail: string;
  deposit: number;        // renamed to "Get Money" in UI
  recurringCost: number;
  recurringDetail: string;
  capitalCost: number;
  capitalDetail: string;
};

export function OfficeCostClient() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gridData, setGridData] = useState<RowData[]>([]);
  const [previousBalance, setPreviousBalance] = useState(0);
  const isInitialLoad = useRef(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 2 + i);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getJson<{ records: any[]; previousBalance: number }>(
        `/api/office-cost?month=${selectedMonth}&year=${selectedYear}`
      );
      const { records, previousBalance: pb } = res;
      setPreviousBalance(Number(pb) || 0);

      const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
      const newGrid: RowData[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const ex = records.find((r: any) => r.day === day);
        newGrid.push({
          day,
          date: new Date(selectedYear, selectedMonth - 1, day),
          payAmount:       Number(ex?.payAmount)       || 0,
          bazarCost:       Number(ex?.bazarCost)       || 0,
          details:         ex?.details         ?? "",
          extraCost:       Number(ex?.extraCost)       || 0,
          extraDetail:     ex?.extraDetail     ?? "",
          deposit:         Number(ex?.deposit)         || 0,
          recurringCost:   Number(ex?.recurringCost)   || 0,
          recurringDetail: ex?.recurringDetail ?? "",
          capitalCost:     Number(ex?.capitalCost)     || 0,
          capitalDetail:   ex?.capitalDetail   ?? "",
        });
      }
      setGridData(newGrid);
    } catch (e) {
      console.error(e);
      alert("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData().then(() => {
      setTimeout(() => { isInitialLoad.current = false; }, 1000);
    });
  }, [selectedMonth, selectedYear]);

  // Auto-save logic
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    setIsSyncing(true);
    const timer = setTimeout(() => {
      handleSave(true);
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [gridData]);

  // Running "Bazer Balance" = previous month closing balance + cumulative (payAmount - bazarCost) per day
  const computedGrid = useMemo(() => {
    let running = Number(previousBalance) || 0;
    return gridData.map(row => {
      const pay   = Number(row.payAmount)  || 0;
      const bazar = Number(row.bazarCost)  || 0;
      running = running + pay - bazar;
      return { ...row, bazerBalance: running };
    });
  }, [gridData, previousBalance]);

  // Summary calculations
  const summary = useMemo(() => {
    let totalGetMoney = 0;   // "Get Money" (was Deposit)
    let totalBazar     = 0;
    let totalExtra     = 0;
    let totalRecurring = 0;
    let totalCapital   = 0;

    gridData.forEach(row => {
      totalGetMoney  += Number(row.deposit)      || 0;
      totalBazar     += Number(row.bazarCost)    || 0;
      totalExtra     += Number(row.extraCost)    || 0;
      totalRecurring += Number(row.recurringCost) || 0;
      totalCapital   += Number(row.capitalCost)  || 0;
    });

    // Total Cost = all spending categories combined
    const totalCost = totalBazar + totalExtra + totalRecurring + totalCapital;
    // Remain Balance = money received - total spent
    const remainBalance = totalGetMoney - totalCost;

    return { totalGetMoney, totalBazar, totalExtra, totalRecurring, totalCapital, totalCost, remainBalance };
  }, [gridData]);

  function updateRow(index: number, field: keyof RowData, value: string | number) {
    setGridData(prev => {
      const next = [...prev];
      // Always store numeric fields as real numbers, NEVER as strings
      const stored = NUMERIC_FIELDS.has(field)
        ? (parseFloat(String(value)) || 0)
        : value;
      next[index] = { ...next[index], [field]: stored };
      return next;
    });
  }

  async function handleSave(isAuto = false) {
    if (!isAuto) setSaving(true);
    setIsSyncing(true);
    try {
      const payload = computedGrid.map(row => ({
        month: selectedMonth,
        year:  selectedYear,
        day:   row.day,
        date:  row.date,
        payAmount:       Number(row.payAmount)       || 0,
        bazarCost:       Number(row.bazarCost)       || 0,
        details:         row.details,
        extraCost:       Number(row.extraCost)       || 0,
        extraDetail:     row.extraDetail,
        deposit:         Number(row.deposit)         || 0,
        recurringCost:   Number(row.recurringCost)   || 0,
        recurringDetail: row.recurringDetail,
        capitalCost:     Number(row.capitalCost)     || 0,
        capitalDetail:   row.capitalDetail,
      }));
      await sendJson("/api/office-cost", "POST", payload);
      if (!isAuto) alert("Saved successfully!");
    } catch (e: any) {
      if (!isAuto) alert("Failed to save: " + (e?.message || "Unknown error"));
      console.error("Auto-save failed", e);
    } finally {
      if (!isAuto) setSaving(false);
      setIsSyncing(false);
    }
  }

  // CSS helpers
  const numInput  = "w-full bg-transparent px-2 py-1 outline-none focus:bg-blue-50 text-right tabular-nums";
  const textInput = "w-full bg-transparent px-2 py-1 outline-none focus:bg-blue-50";
  const boldNum   = "w-full bg-transparent px-2 py-1 outline-none focus:bg-blue-50 font-semibold text-slate-800 text-right tabular-nums";

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 80px)" }}>
      <PageHeader
        title="Office Cost Management"
        subtitle="Daily expense tracker. Bazer Balance auto-calculates as a running cash flow."
        actions={
          <div className="flex items-center gap-3">
            {isSyncing ? (
              <div className="flex items-center text-xs text-blue-600 font-medium">
                <CloudUpload className="mr-1.5 h-3.5 w-3.5 animate-bounce" />
                Syncing...
              </div>
            ) : (
              <div className="flex items-center text-xs text-emerald-600 font-medium">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Saved
              </div>
            )}
            <div className="w-32">
              <Select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{monthMap[m]}</option>)}
              </Select>
            </div>
            <div className="w-28">
              <Select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <Button onClick={() => handleSave(false)} disabled={saving || loading}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-slate-500">Loading…</div>
      ) : (
        <div className="flex flex-1 gap-5 overflow-hidden pb-2">

          {/* ── Spreadsheet ── */}
          <div className="flex-[3] overflow-auto rounded-xl border border-slate-300 bg-white shadow-sm oc-scroll">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                {/* Month banner */}
                <tr>
                  <th colSpan={13} className="bg-fuchsia-300 px-3 py-1 text-left text-base font-bold text-slate-900 border-b border-fuchsia-400">
                    {monthMap[selectedMonth]} {selectedYear}
                  </th>
                </tr>
                {/* Column headers */}
                <tr className="bg-yellow-300 text-slate-900 text-xs font-bold">
                  <th className="border border-yellow-400 px-2 py-1.5 text-left whitespace-nowrap">Date</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap">Pay Amount</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap">Bazer Cost</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap bg-amber-200">Bazer Balance</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-left whitespace-nowrap">Details</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap">Extra Cost</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-left whitespace-nowrap">Extra Detail</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap bg-emerald-200">Get Money</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap">Recurring Cost</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-left whitespace-nowrap">Recurring Detail</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-right whitespace-nowrap">Capital Cost</th>
                  <th className="border border-yellow-400 px-2 py-1.5 text-left whitespace-nowrap">Capital Detail</th>
                </tr>
              </thead>
              <tbody>
                {computedGrid.map((row, i) => (
                  <tr key={row.day} className="border-b border-slate-200 hover:bg-slate-50 focus-within:bg-blue-50/30 transition-colors">
                    {/* Date */}
                    <td className="border-r border-slate-200 px-2 py-0.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {format(row.date, "dd-MM-yyyy")}
                    </td>
                    {/* Pay Amount */}
                    <td className="border-r border-slate-200 p-0 w-24">
                      <input type="number" value={row.payAmount || ""} onChange={e => updateRow(i, "payAmount", e.target.value)} className={numInput} />
                    </td>
                    {/* Bazer Cost */}
                    <td className="border-r border-slate-200 p-0 w-24">
                      <input type="number" value={row.bazarCost || ""} onChange={e => updateRow(i, "bazarCost", e.target.value)} className={numInput} />
                    </td>
                    {/* Bazer Balance (auto, read-only) */}
                    <td className="border-r border-slate-200 px-2 py-0.5 text-right font-semibold bg-amber-50 w-24 whitespace-nowrap tabular-nums text-slate-800">
                      {row.bazerBalance !== 0 ? row.bazerBalance.toLocaleString() : ""}
                    </td>
                    {/* Details */}
                    <td className="border-r border-slate-200 p-0 min-w-[120px]">
                      <input type="text" value={row.details} onChange={e => updateRow(i, "details", e.target.value)} className={textInput} />
                    </td>
                    {/* Extra Cost */}
                    <td className="border-r border-slate-200 p-0 w-24">
                      <input type="number" value={row.extraCost || ""} onChange={e => updateRow(i, "extraCost", e.target.value)} className={numInput} />
                    </td>
                    {/* Extra Detail */}
                    <td className="border-r border-slate-200 p-0 min-w-[120px]">
                      <input type="text" value={row.extraDetail} onChange={e => updateRow(i, "extraDetail", e.target.value)} className={textInput} />
                    </td>
                    {/* Get Money (was Deposit) */}
                    <td className="border-r border-slate-200 p-0 w-28">
                      <input type="number" value={row.deposit || ""} onChange={e => updateRow(i, "deposit", e.target.value)}
                        className={`${numInput} ${row.deposit < 0 ? "text-red-600" : "text-emerald-700 font-semibold"}`} />
                    </td>
                    {/* Recurring Cost */}
                    <td className="border-r border-slate-200 p-0 w-28">
                      <input type="number" value={row.recurringCost || ""} onChange={e => updateRow(i, "recurringCost", e.target.value)} className={boldNum} />
                    </td>
                    {/* Recurring Detail */}
                    <td className="border-r border-slate-200 p-0 min-w-[120px]">
                      <input type="text" value={row.recurringDetail} onChange={e => updateRow(i, "recurringDetail", e.target.value)} className={textInput} />
                    </td>
                    {/* Capital Cost */}
                    <td className="border-r border-slate-200 p-0 w-28">
                      <input type="number" value={row.capitalCost || ""} onChange={e => updateRow(i, "capitalCost", e.target.value)} className={boldNum} />
                    </td>
                    {/* Capital Detail */}
                    <td className="p-0 min-w-[120px]">
                      <input type="text" value={row.capitalDetail} onChange={e => updateRow(i, "capitalDetail", e.target.value)} className={textInput} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Summary Panel ── */}
          <div className="max-w-[290px] flex-1">
            <div className="sticky top-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">Monthly Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Bazar Cost</span>
                  <span className="text-red-600 tabular-nums">{summary.totalBazar.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Extra Cost</span>
                  <span className="text-red-600 tabular-nums">{summary.totalExtra.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Recurring Cost</span>
                  <span className="text-red-600 tabular-nums">{summary.totalRecurring.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Capital Cost</span>
                  <span className="text-red-600 tabular-nums">{summary.totalCapital.toLocaleString()}</span>
                </div>

                <div className="my-3 border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">Total Get Money</span>
                    <span className="text-emerald-600 tabular-nums text-base">{summary.totalGetMoney.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">Total Cost</span>
                    <span className="text-red-600 tabular-nums text-base">{summary.totalCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between rounded-lg px-4 py-3 font-black text-white
                  ${summary.remainBalance >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
                  <span>Remain Balance</span>
                  <span className="text-lg tabular-nums">{summary.remainBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .oc-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .oc-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .oc-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}} />
    </div>
  );
}
