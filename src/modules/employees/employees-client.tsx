"use client";

import { useMemo, useState } from "react";
import { Eye, History, Pencil, Plus, Trash2, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Employee, ModalMode } from "@/types";
import { useAsyncData } from "@/modules/shared/use-async-data";
import { sendJson } from "@/lib/http";
import { EmployeeForm } from "./employee-form";
import { EmployeeDetails } from "./employee-details";
import { calculateDuration, getJoiningYear } from "@/utils/calculations";
import { format } from "date-fns";
import { LoadingState } from "@/modules/shared/loading-state";
import { ErrorState } from "@/modules/shared/error-state";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { Input } from "@/components/ui/input";

export function EmployeesClient() {
  const router = useRouter();
  // Active employees only
  const { data, loading, error, refresh } = useAsyncData<Employee[]>("/api/employees", []);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selected, setSelected] = useState<Employee | undefined>();
  const dialog = useDialog();

  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      [item.name, item.employeeCode, item.designation, item.department || "", item.email || ""]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [data, query]);

  async function handleSubmit(payload: Record<string, unknown>) {
    if (mode === "create") {
      await sendJson("/api/employees", "POST", payload);
    } else if (selected && mode === "edit") {
      await sendJson(`/api/employees/${selected.id}`, "PUT", payload);
    }
    setOpen(false);
    setSelected(undefined);
    await refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await sendJson(`/api/employees/${selected.id}/password`, "PUT", { password: newPassword });
      setOpen(false);
      setNewPassword("");
      setSelected(undefined);
    } catch(err) {
      alert("Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleDelete(item: Employee) {
    const ok = await dialog.danger(
      `Disable "${item.name}"?`,
      <p className="text-sm text-slate-600">This employee will be disabled and moved to History. You can restore them later.</p>
    );
    if (!ok) return;
    await sendJson(`/api/employees/${item.id}`, "DELETE");
    await refresh();
  }

  const columns = [
    { key: "employeeCode", title: "Code", render: (row: Employee) => row.employeeCode },
    {
      key: "name",
      title: "Employee",
      render: (row: Employee) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-slate-500">{row.designation}</p>
        </div>
      )
    },
    {
      key: "dates",
      title: "Dates",
      render: (row: Employee) => (
        <div className="space-y-1 text-xs">
          <p>Joining: {format(new Date(row.joiningDate), "dd MMM yyyy")}</p>
          <p>DOB: {format(new Date(row.dateOfBirth), "dd MMM yyyy")}</p>
        </div>
      )
    },
    {
      key: "birthday",
      title: "Birthday Wish",
      render: (row: Employee) => <span className="text-xs font-medium">{format(new Date(row.dateOfBirth), "dd MMM")}</span>
    },
    {
      key: "anniversary",
      title: "Anniversary Wish",
      render: (row: Employee) => <span className="text-xs font-medium">{format(new Date(row.joiningDate), "dd MMM")}</span>
    },
    { key: "year", title: "Joining Year", render: (row: Employee) => getJoiningYear(row.joiningDate) },
    { key: "duration", title: "Duration", render: (row: Employee) => calculateDuration(row.joiningDate) },
    {
      key: "actions",
      title: "Actions",
      render: (row: Employee) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-9 px-3 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-none"
            onClick={() => { setMode("password"); setSelected(row); setNewPassword(""); setOpen(true); }}
            title="Change Login Credentials"
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="h-9 px-3 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-none"
            onClick={() => { setMode("details"); setSelected(row); setOpen(true); }}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="h-9 px-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-none"
            onClick={() => { setMode("edit"); setSelected(row); setOpen(true); }}
            title="Edit Employee"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="danger"
            className="h-9 px-3"
            onClick={() => handleDelete(row)}
            title="Disable Employee"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Database"
        subtitle="Manage employee information with reusable CRUD flows."
        actions={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/employees/history")}
            >
              <History className="mr-2 h-4 w-4" /> History
            </Button>
            <Button onClick={() => { setMode("create"); setSelected(undefined); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </div>
        }
      />

      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search employees..." />

      <DataTable data={filteredData} columns={columns} />

      <Modal
        open={open}
        title={mode === "create" ? "Add Employee" : mode === "edit" ? "Edit Employee" : mode === "password" ? `Update Login Details` : "Employee Details"}
        description={
          mode === "details"
            ? "View all collected information for this employee."
            : mode === "password" 
            ? `Change the portal login password for ${selected?.name || "Employee"}.`
            : "All modules use this employee data as a shared source of truth."
        }
        onClose={() => setOpen(false)}
      >
        {mode === "details" && selected ? (
          <EmployeeDetails employee={selected} onClose={() => setOpen(false)} />
        ) : mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <Input 
                type="text" 
                placeholder="Enter at least 6 characters" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={isUpdatingPassword || newPassword.length < 6}>
                 {isUpdatingPassword ? "Updating Engine..." : "Save Password"}
               </Button>
            </div>
          </form>
        ) : (
          <EmployeeForm initialData={selected} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        )}
      </Modal>

    </div>
  );
}
