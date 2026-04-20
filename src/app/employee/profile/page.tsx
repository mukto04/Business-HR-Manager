"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { User, Mail, Phone, Calendar, Fingerprint, Shield, Users, GraduationCap, Briefcase, Droplets, CreditCard, Camera, Loader2, CheckCircle2 } from "lucide-react";

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/employee/me")
      .then(res => res.json())
      .then(data => {
        setEmployee(data);
        setLoading(false);
      });
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // Image Compression Logic
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7)); // 0.7 quality is perfect
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });

      const res = await fetch("/api/employee/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedBase64 }),
      });

      if (res.ok) {
        setEmployee({ ...employee, image: compressedBase64 });
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  }

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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-slate-800 truncate">{value || "Not Set"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personal Workspace</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1 opacity-60">Verified Employee Identity Profile</p>
        </div>
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-sm">
           <CheckCircle2 className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Status: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 text-center relative overflow-hidden group/card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="absolute top-0 right-0 p-6">
               <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            </div>
            
            {/* Avatar Section */}
            <div className="relative w-40 h-40 mx-auto mb-8">
               <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-[3rem] flex items-center justify-center text-white text-5xl font-black shadow-[0_20px_50px_rgba(99,102,241,0.3)] overflow-hidden relative group/avatar transition-all duration-700 hover:scale-105 hover:rotate-2">
                 {employee?.image ? (
                   <img src={employee.image} alt={employee.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="drop-shadow-lg">{employee?.name?.charAt(0)}</span>
                 )}
                 
                 {/* Upload Overlay */}
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500"
                 >
                   {uploading ? (
                     <Loader2 className="w-10 h-10 text-white animate-spin" />
                   ) : (
                     <>
                       <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 border border-white/30">
                          <Camera className="w-6 h-6 text-white" />
                       </div>
                       <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Update Identity</span>
                     </>
                   )}
                 </button>
               </div>
               <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
               />
               
               {/* Decorative Ring */}
               <div className="absolute -inset-4 border-2 border-dashed border-indigo-100 rounded-[3.5rem] animate-[spin_20s_linear_infinite] group-hover/card:border-indigo-200 transition-colors pointer-events-none"></div>
            </div>

            <div className="space-y-1">
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{employee?.name}</h2>
               <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                 {employee?.designation}
               </div>
            </div>
            
            <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-2 gap-6 text-left">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Badge ID</p>
                 <p className="text-sm font-black text-slate-800 font-mono tracking-tight">{employee?.employeeCode}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Tenure</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {employee?.joiningDate ? format(new Date(employee.joiningDate), "MMM yyyy") : "-"}
                 </p>
               </div>
            </div>
          </div>

          <div className="bg-[#0B0F1A] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[80px] -ml-10 -mb-10"></div>
            
            <h3 className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-indigo-400 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                 <Fingerprint size={16} />
              </div>
              Digital Security
            </h3>
            
            <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5 backdrop-blur-xl relative z-10 hover:border-white/10 transition-colors group/sec">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 group-hover/sec:text-indigo-400 transition-colors">Fingerprint Engine ID</p>
               <p className="text-4xl font-black text-white tracking-tighter font-mono">{employee?.fingerprintId || "VOID"}</p>
            </div>
            
            <p className="text-[11px] text-slate-500 mt-8 leading-relaxed font-bold italic opacity-40 uppercase tracking-widest text-center">
              Shared Cryptographic Identity Key
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] group/panel">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform duration-500 group-hover/panel:rotate-12">
                  <User size={22} />
                </div>
                Vitals & Identity
              </h3>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Metadata Group 01</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={Mail} label="Professional Email" value={employee?.email} />
              <InfoItem icon={Phone} label="Direct Contact" value={employee?.phone} />
              <InfoItem icon={Calendar} label="Date of Birth" value={employee?.dateOfBirth ? format(new Date(employee.dateOfBirth), "dd MMM, yyyy") : "-"} />
              <InfoItem icon={Droplets} label="Blood Group" value={employee?.bloodGroup} colorClass="text-red-500 bg-red-50" />
              <InfoItem icon={CreditCard} label="Govt. NID Number" value={employee?.nidNumber} colorClass="text-blue-500 bg-blue-50" />
              <InfoItem icon={GraduationCap} label="Educational Level" value={employee?.educationStatus} colorClass="text-emerald-500 bg-emerald-50" />
            </div>
          </div>

          {/* HR & Employment */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] group/panel">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform duration-500 group-hover/panel:-rotate-12">
                <Briefcase size={22} />
              </div>
              Career Intelligence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-6 rounded-[2rem] bg-[#0B0F1A] text-white shadow-2xl transition hover:scale-[1.02] duration-300">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group/icon">
                    <Shield className="h-6 w-6 text-indigo-500 group-hover/icon:animate-pulse" />
                 </div>
                 <div className="ml-5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Assigned Division</p>
                    <p className="font-black text-xl leading-tight uppercase tracking-tight">{employee?.department || "CORE OPS"}</p>
                 </div>
              </div>
              <InfoItem icon={Briefcase} label="Officer Designation" value={employee?.designation} />
            </div>
          </div>

          {/* Guardian Info */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] group/panel">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight">
               <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform duration-500 group-hover/panel:scale-110">
                <Users size={22} />
               </div>
               Next of Kin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InfoItem icon={User} label="Primary Contact" value={employee?.guardianName} />
               <InfoItem icon={Shield} label="Guardian Status" value={employee?.guardianRelation} colorClass="text-amber-500 bg-amber-50" />
               <InfoItem icon={Phone} label="Emergency Hotline" value={employee?.guardianPhone} colorClass="text-indigo-500 bg-indigo-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
