"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { SalaryStructure } from "@/types";
import { useAsyncData } from "@/modules/shared/use-async-data";
import Link from "next/link";
import { sendJson } from "@/lib/http";
import { LoadingState } from "@/modules/shared/loading-state";
import { ErrorState } from "@/modules/shared/error-state";
import { formatCurrency } from "@/utils/calculations";
import { useDialog } from "@/components/ui/dialog-provider";

export function SalaryClient() {
  const salaries = useAsyncData<SalaryStructure[]>("/api/salary", []);
  const [query, setQuery] = useState("");
  const dialog = useDialog();

  const filtered = useMemo(() => {
    return salaries.data.filter((item) =>
      (item.employee?.name || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [salaries.data, query]);

  async function remove(item: SalaryStructure) {
    const ok = await dialog.danger(
      "Delete this salary structure?",
      <p className="text-sm text-slate-600">This will permanently remove <strong>{item.employee?.name}</strong>'s salary structure.</p>
    );
    if (!ok) return;
    await sendJson(`/api/salary/${item.id}`, "DELETE");
    await salaries.refresh();
  }

  if (salaries.loading) return <LoadingState />;
  if (salaries.error) return <ErrorState message={salaries.error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Structure"
        subtitle="Define salary structure and auto-calculate the requested breakdown."
        actions={
          <div className="flex gap-3">
            <Link href="/salary/history">
              <Button variant="secondary">History</Button>
            </Link>
            <Link href="/salary/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Salary
              </Button>
            </Link>
          </div>
        }
      />

      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search salary structures..." />

      <DataTable
        data={filtered}
        columns={[
          { key: "employee", title: "Name", render: (row) => row.employee?.name || "-" },
          { key: "totalSalary", title: "Total Salary", render: (row) => formatCurrency(row.totalSalary) },
          { key: "basicSalary", title: "Basic Salary: 50%", render: (row) => formatCurrency(row.basicSalary) },
          { key: "hra", title: "H.R.A: 25%", render: (row) => formatCurrency(row.hra) },
          { key: "medicalAllowance", title: "M.A: 12.5%", render: (row) => formatCurrency(row.medicalAllowance) },
          { key: "travelAllowance", title: "T.A: 5%", render: (row) => formatCurrency(row.travelAllowance) },
          { key: "others", title: "Others: 7.5%", render: (row) => formatCurrency(row.others) },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Link href={`/salary/${row.id}`}>
                  <Button variant="secondary" className="h-9 px-3">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="danger" className="h-9 px-3" onClick={() => remove(row)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
