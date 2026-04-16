"use client";

import { useEffect, useState } from "react";
import { AdvanceSalary, Employee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/calculations";

const months = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];

export function AdvanceSalaryForm({
  employees,
  initialData,
  onSubmit,
  onCancel,
}: {
  employees: Employee[];
  initialData?: Partial<AdvanceSalary>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    employeeId: "",
    amount: "0",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    isDeducted: false,
    note: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        employeeId: initialData.employeeId ?? "",
        amount: String(initialData.amount ?? 0),
        month: String(initialData.month ?? new Date().getMonth() + 1),
        year: String(initialData.year ?? new Date().getFullYear()),
        isDeducted: initialData.isDeducted ?? false,
        note: initialData.note ?? "",
      });
    }
  }, [initialData]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
          await onSubmit({
            employeeId: form.employeeId,
            amount: Number(form.amount),
            month: Number(form.month),
            year: Number(form.year),
            isDeducted: form.isDeducted,
            note: form.note,
          });
        } catch (err: any) {
          setError(err.message || "Something went wrong.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          Select Employee
        </label>
        <Combobox
          options={employees}
          value={form.employeeId}
          onChange={(val) => setForm({ ...form, employeeId: val })}
          placeholder="Search and select employee..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Advance Amount
          </label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Month
          </label>
          <Select
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Year
          </label>
          <Input
            type="number"
            min="2000"
            placeholder={String(new Date().getFullYear())}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </div>


      </div>

      <Textarea
        placeholder="Note (optional)"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
      />

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        Advance amount:{" "}
        <span className="font-semibold">{formatCurrency(Number(form.amount || 0))}</span>

      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Advance Salary"}
        </Button>
      </div>
    </form>
  );
}
