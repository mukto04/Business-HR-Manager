"use client";

import { useEffect, useState } from "react";
import { Employee, SalaryStructure } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { calculateSalaryBreakdown, formatCurrency } from "@/utils/calculations";

export function SalaryForm({
  employees,
  initialData,
  onSubmit,
  onCancel
}: {
  employees: Employee[];
  initialData?: Partial<SalaryStructure>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    employeeId: "",
    totalSalary: "0"
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        employeeId: initialData.employeeId ?? "",
        totalSalary: String(initialData.totalSalary ?? 0)
      });
    }
  }, [initialData]);

  const breakdown = calculateSalaryBreakdown(Number(form.totalSalary || 0));

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          employeeId: form.employeeId,
          totalSalary: Number(form.totalSalary)
        });
      }}
    >
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
      <Input type="number" min="0" value={form.totalSalary} onChange={(e) => setForm({ ...form, totalSalary: e.target.value })} />

      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(breakdown)
          .filter(([key]) => key !== "festivalBonus")
          .map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 p-4 text-sm">
            <p className="capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</p>
            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(value as number)}</p>
          </div>
        ))}
      </div>



      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Salary Structure</Button>
      </div>
    </form>
  );
}
