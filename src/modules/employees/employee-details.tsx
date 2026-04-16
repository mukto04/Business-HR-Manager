"use client";

import { Employee } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export function EmployeeDetails({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-slate-50/50 text-slate-900">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Employee ID</p>
          <p className="font-semibold">{employee.employeeCode}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Name</p>
          <p className="font-semibold">{employee.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Designation</p>
          <p className="font-semibold">{employee.designation}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Department</p>
          <p className="font-semibold">{employee.department || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Email</p>
          <p className="font-semibold">{employee.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Phone</p>
          <p className="font-semibold">{employee.phone || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Joining Date</p>
          <p className="font-semibold">{format(new Date(employee.joiningDate), "dd MMM yyyy")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Date of Birth</p>
          <p className="font-semibold">{format(new Date(employee.dateOfBirth), "dd MMM yyyy")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Fingerprint ID</p>
          <p className="font-semibold text-brand-600">{employee.fingerprintId || "Not set"}</p>
        </div>
        
        <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Personal & Guardian Records</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Blood Group</p>
              <p className="text-sm font-bold text-rose-600">{employee.bloodGroup || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">NID Number</p>
              <p className="text-sm font-bold text-slate-800">{employee.nidNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Education</p>
              <p className="text-sm font-bold text-slate-800">{employee.educationStatus || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Guardian Name</p>
              <p className="text-sm font-bold text-slate-800">{employee.guardianName || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Relation</p>
              <p className="text-sm font-bold text-slate-800">{employee.guardianRelation || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Guardian Phone</p>
              <p className="text-sm font-bold text-slate-800">{employee.guardianPhone || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 mt-4 pt-4 border-t border-border">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Salary Structure</p>
          <p className="font-semibold text-lg text-emerald-600">
            ৳{employee.salaryStructure?.totalSalary?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
