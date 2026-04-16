"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Holiday } from "@/types";

export function HolidayForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: Partial<Holiday>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    date: "",
    totalDays: "1"
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        date: initialData.date ? initialData.date.slice(0, 10) : "",
        totalDays: String(initialData.totalDays ?? 1)
      });
    }
  }, [initialData]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...form,
          totalDays: Number(form.totalDays)
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Holiday name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input type="number" min="1" value={form.totalDays} onChange={(e) => setForm({ ...form, totalDays: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Holiday</Button>
      </div>
    </form>
  );
}
