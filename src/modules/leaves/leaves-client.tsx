"use client";

import { useMemo, useState } from "react";
import { Pencil, Cpu, Trash2, Minus, Printer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { LeaveBalance, ModalMode } from "@/types";
import { useAsyncData } from "@/modules/shared/use-async-data";
import { useEmployees } from "@/modules/shared/use-employees";
import { sendJson } from "@/lib/http";
import { LeaveForm } from "./leave-form";
import { LoadingState } from "@/modules/shared/loading-state";
import { ErrorState } from "@/modules/shared/error-state";
import { Select } from "@/components/ui/select";
import { useDialog } from "@/components/ui/dialog-provider";

export function LeavesClient() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const leaves = useAsyncData<LeaveBalance[]>(`/api/leaves?year=${selectedYear}`, []);
  const employees = useEmployees();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("edit");
  const [selected, setSelected] = useState<LeaveBalance | undefined>();
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genAmount, setGenAmount] = useState(0);
  const [overwrite, setOverwrite] = useState(false);
  const dialog = useDialog();

  const filtered = useMemo(() => {
    return leaves.data.filter((item) =>
      (item.employee?.name || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [leaves.data, query]);

  async function deductOne(item: LeaveBalance) {
    if (item.dueLeave <= 0) {
      const ok = await dialog.danger("Are you sure?", <p className="text-sm text-slate-600">This employee has 0 due leave. Do you still want to deduct 1 day?</p>);
      if (!ok) return;
    }
    try {
      await sendJson(`/api/leaves/${item.id}`, "PUT", {
        employeeId: item.employeeId,
        year: item.year,
        totalLeave: item.totalLeave,
        dueLeave: item.dueLeave - 1
      });
      await leaves.refresh();
    } catch (e: any) {
      dialog.alert("Error", e.message || "Failed to deduct leave.");
    }
  }

  async function handleBulkGenerate() {
    try {
      setGenerating(true);
      const res = await sendJson("/api/leaves/bulk", "POST", {
        year: genYear,
        defaultAmount: genAmount,
        overwrite: overwrite
      });
      
      setShowGenerateModal(false);
      dialog.alert("Success", res.message || "Leave balances generated successfully.");
      await leaves.refresh();
    } catch (e: any) {
      dialog.alert("Error", e.message || "Failed to generate leave balances.");
    } finally {
      setGenerating(false);
    }
  }

  async function submit(payload: Record<string, unknown>) {
    try {
      if (selected) {
        await sendJson(`/api/leaves/${selected.id}`, "PUT", payload);
      }
      setOpen(false);
      setSelected(undefined);
      await leaves.refresh();
    } catch (e: any) {
      dialog.alert("Error", e.message || "Failed to save leave balance.");
    }
  }

  async function remove(item: LeaveBalance) {
    const ok = await dialog.danger(
      "Delete this leave balance?",
      <p className="text-sm text-slate-600">This will permanently remove <strong>{item.employee?.name}</strong>'s leave record for {item.year}.</p>
    );
    if (!ok) return;
    await sendJson(`/api/leaves/${item.id}`, "DELETE");
    await leaves.refresh();
  }

  if (leaves.loading || employees.loading) return <LoadingState />;
  if (leaves.error) return <ErrorState message={leaves.error} />;
  if (employees.error) return <ErrorState message={employees.error} />;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Balance"
        subtitle="Track leave totals and due leave for each employee."
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> 
              Print Report
            </Button>
            <Button onClick={() => setShowGenerateModal(true)}>
              <Cpu className="mr-2 h-4 w-4" /> 
              Generate Balances
            </Button>
          </div>
        }
      />

      <div className="print:hidden">
        <SearchFilterBar 
          value={query} 
          onChange={setQuery} 
          placeholder="Search by employee name..." 
          rightSlot={
            <div className="w-32">
              <Select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          }
        />
      </div>

      <DataTable
        data={filtered}
        columns={[
          { key: "employee", title: "Employee", render: (row) => row.employee?.name || "-" },
          { key: "year", title: "Year", render: (row) => <span className="font-semibold">{row.year}</span> },
          { key: "totalLeave", title: "Total Leave", render: (row) => row.totalLeave },
          { 
            key: "dueLeave", 
            title: "Due Leave", 
            render: (row) => {
              if (row.dueLeave < 0) {
                return (
                  <span className="text-rose-600 font-medium whitespace-nowrap">
                    {row.dueLeave} <span className="text-xs">({Math.abs(row.dueLeave)} extra)</span>
                  </span>
                );
              }
              return row.dueLeave;
            } 
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" className="h-9 px-3" onClick={() => deductOne(row)} title="Deduct 1 Day">
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="secondary" className="h-9 px-3" onClick={() => { setMode("edit"); setSelected(row); setOpen(true); }} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="danger" className="h-9 px-3" onClick={() => remove(row)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal
        open={open}
        title="Edit Leave Balance"
        onClose={() => setOpen(false)}
      >
        <LeaveForm employees={employees.data} initialData={selected} onSubmit={submit} onCancel={() => setOpen(false)} />
      </Modal>

      <Modal
        open={showGenerateModal}
        title="Generate Annual Leave Balances"
        onClose={() => setShowGenerateModal(false)}
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            This will create leave balance records for all active employees who don't have one for the selected year.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Year</label>
              <Select value={genYear} onChange={(e) => setGenYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Default Leave Count</label>
              <Input 
                type="number" 
                value={genAmount} 
                onChange={(e) => setGenAmount(Number(e.target.value))}
                placeholder="e.g. 10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
            <input 
              type="checkbox" 
              id="overwrite"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <label htmlFor="overwrite" className="text-sm font-bold text-red-900 cursor-pointer">
              Overwrite existing balances for {genYear}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button onClick={handleBulkGenerate} disabled={generating}>
              {generating ? "Generating..." : "Generate for All"}
            </Button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: A4; 
            margin: 0; /* Remove browser header/footer (Date, URL) */
          }
          body { 
            background: white !important; 
            font-size: 12pt; 
            padding: 20mm; /* Add back margin internally */
          }
          .print\:hidden { display: none !important; }
          
          /* Hide Sidebar and other UI elements */
          aside, nav, header, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          
          /* Format Table */
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #e2e8f0 !important; }
          th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; text-align: left !important; }
          th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          
          /* Hide the last column (Actions) */
          th:last-child, td:last-child { display: none !important; }

          /* Title formatting */
          h1 { font-size: 24pt !important; margin-bottom: 5mm !important; }
          p { margin-bottom: 5mm !important; }
        }
      `}} />
    </div>
  );
}
