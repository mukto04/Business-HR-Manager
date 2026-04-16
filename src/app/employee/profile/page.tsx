"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { User, Mail, Phone, Calendar, Fingerprint, Shield, Users, GraduationCap, Briefcase, Droplets, CreditCard } from "lucide-react";

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/me")
      .then(res => res.json())
      .then(data => {
        setEmployee(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-white rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-3xl" />
          <div className="h-64 bg-white rounded-3xl" />
        </div>
      </div>
    );
  }

  const InfoItem = ({ icon: Icon, label, value, colorClass = "text-indigo-600 bg-indigo-50" }: any) => (
    <div className="flex items-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition hover:shadow-md">
      <div className={`p-3 rounded-xl ${colorClass} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-4 overflow-hidden">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-slate-800 truncate">{value || "Not Set"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 text-sm">View your personal and employment information (Read-Only)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-wider">Active</span>
            </div>
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-100 mb-4 group-hover:scale-110 transition-transform">
              {employee?.name?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{employee?.name}</h2>
            <p className="text-indigo-600 font-medium text-sm mb-6">{employee?.designation}</p>
            
            <div className="space-y-3 pt-6 border-t border-slate-50">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Employee ID</span>
                 <span className="font-bold text-slate-700">{employee?.employeeCode}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Joined</span>
                 <span className="font-bold text-slate-700">
                   {employee?.joiningDate ? format(new Date(employee.joiningDate), "dd MMM, yyyy") : "-"}
                 </span>
               </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
            <h3 className="flex items-center gap-2 font-bold mb-4">
              <Fingerprint className="h-5 w-5" />
              Fingerprint Access
            </h3>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
               <p className="text-sm text-indigo-200 mb-1">Assigned Device ID</p>
               <p className="text-2xl font-mono font-bold">{employee?.fingerprintId || "Not Assigned"}</p>
            </div>
            <p className="text-[10px] text-indigo-300 mt-4 leading-relaxed italic">
              * This ID is used for biometric attendance synchronization. Please contact HR if this ID is incorrect.
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={Mail} label="Email Address" value={employee?.email} />
              <InfoItem icon={Phone} label="Phone Number" value={employee?.phone} />
              <InfoItem icon={Calendar} label="Date of Birth" value={employee?.dateOfBirth ? format(new Date(employee.dateOfBirth), "dd MMM, yyyy") : "-"} />
              <InfoItem icon={Droplets} label="Blood Group" value={employee?.bloodGroup} colorClass="text-red-500 bg-red-50" />
              <InfoItem icon={CreditCard} label="NID Number" value={employee?.nidNumber} colorClass="text-blue-500 bg-blue-50" />
              <InfoItem icon={GraduationCap} label="Education" value={employee?.educationStatus} colorClass="text-emerald-500 bg-emerald-50" />
            </div>
          </div>

          {/* HR & Employment */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={Shield} label="Department" value={employee?.department || "General"} colorClass="text-purple-500 bg-purple-50" />
              <InfoItem icon={Briefcase} label="Designation" value={employee?.designation} />
            </div>
          </div>

          {/* Guardian Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Users className="h-5 w-5 text-indigo-500" />
               Guardian Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InfoItem icon={User} label="Guardian Name" value={employee?.guardianName} />
               <InfoItem icon={Shield} label="Relationship" value={employee?.guardianRelation} colorClass="text-amber-500 bg-amber-50" />
               <InfoItem icon={Phone} label="Guardian Phone" value={employee?.guardianPhone} colorClass="text-indigo-500 bg-indigo-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
