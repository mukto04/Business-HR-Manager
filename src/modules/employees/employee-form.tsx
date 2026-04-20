"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Employee } from "@/types";

const departments = [
  "CEO",
  "CO-CEO",
  "Front End Developer",
  "Backend Developer",
  "Designer",
  "Video Editor",
  "SQA",
  "SEO",
  "HR",
  "Office Assistant",
  "Other"
];

export function EmployeeForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: Partial<Employee>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    employeeCode: "",
    fingerprintId: "",
    name: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    joiningDate: "",
    dateOfBirth: "",
    salary: 0,
    bloodGroup: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    nidNumber: "",
    educationStatus: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        employeeCode: initialData.employeeCode ?? "",
        fingerprintId: initialData.fingerprintId ?? "",
        name: initialData.name ?? "",
        designation: initialData.designation ?? "",
        department: initialData.department ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        joiningDate: initialData.joiningDate ? initialData.joiningDate.slice(0, 10) : "",
        dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.slice(0, 10) : "",
        salary: initialData.salaryStructure?.totalSalary ?? 0,
        bloodGroup: initialData.bloodGroup ?? "",
        guardianName: initialData.guardianName ?? "",
        guardianRelation: initialData.guardianRelation ?? "",
        guardianPhone: initialData.guardianPhone ?? "",
        nidNumber: initialData.nidNumber ?? "",
        educationStatus: initialData.educationStatus ?? ""
      });
    }
  }, [initialData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err: any) {
      // Set the error state but don't console.error (to avoid dev overlay)
      setError(err.message || "Failed to save employee. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="relative space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-6 items-start">
        {/* Basic Info */}
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Name</label>
          <Input placeholder="Employee name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Designation</label>
          <Input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Employee ID (Code)</label>
          <Input placeholder="E.g. ADE..." value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} required />
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-brand-600">Fingerprint ID</label>
          <Input placeholder="Device ID (e.g. 1)" value={form.fingerprintId} onChange={(e) => setForm({ ...form, fingerprintId: e.target.value })} />
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Department</label>
          <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Salary</label>
          <Input type="number" min="0" placeholder="Monthly Gross" value={form.salary || ""} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Joining Date</label>
          <Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} required />
        </div>
        
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Date of Birth</label>
          <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Blood Group</label>
          <Input placeholder="e.g. A+, O-" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Email Address</label>
          <Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Phone Number</label>
          <Input placeholder="+8801..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="md:col-span-6 border-t border-slate-100 pt-6 mt-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Guardian & Identity Records</h4>
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">NID Card Number</label>
          <Input placeholder="National ID number" value={form.nidNumber} onChange={(e) => setForm({ ...form, nidNumber: e.target.value })} />
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="text-sm font-bold text-slate-700">Education Status</label>
          <Input placeholder="Qualifcation/Degree" value={form.educationStatus} onChange={(e) => setForm({ ...form, educationStatus: e.target.value })} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Guardian Name</label>
          <Input placeholder="Name" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Relation</label>
          <Input placeholder="e.g. Father/Husband" value={form.guardianRelation} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Guardian Contact</label>
          <Input placeholder="Phone number" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Button>
      </div>

      {error && (
        <div className="p-4 mt-2 rounded-xl bg-red-50 border border-red-200 text-red-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 font-bold mb-1">
             <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
             Quota Exceeded
          </div>
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}
    </form>
  );
}
