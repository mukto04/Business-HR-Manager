"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Key, 
  Save, 
  Loader2, 
  Lock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/super-admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update password.");
        return;
      }

      setSuccess("Master password updated successfully! Please use the new password for future logins.");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 bg-slate-900 shadow-2xl p-8 rounded-[32px] border border-slate-800 backdrop-blur-md">
        <div className="bg-red-600 p-3 rounded-2xl">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Security</h1>
          <p className="text-slate-500 font-medium">Manage Master Controller credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Warning Card */}
        <div className="md:col-span-1 space-y-4">
           <div className="bg-yellow-600/10 border border-yellow-600/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-yellow-500 font-bold">
                 <AlertTriangle className="w-5 h-5" />
                 <h3>Critical Access</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Changing this password updates the primary "Master Key" for this server. 
                All Super Admin sessions will require this new password upon next login.
              </p>
              <div className="pt-2">
                 <span className="text-[10px] bg-yellow-600/20 text-yellow-500 px-3 py-1 rounded-full border border-yellow-600/30 uppercase font-black">Level 1 Security</span>
              </div>
           </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
           <form onSubmit={handlePasswordChange} className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-8">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Current Master Password</label>
                    <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-red-500 transition-colors" />
                       <input 
                         type="password"
                         required
                         value={formData.currentPassword}
                         onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                         className="w-full bg-black border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                         placeholder="Enter current password"
                       />
                    </div>
                 </div>

                 <div className="h-px bg-slate-800 my-2" />

                 <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">New Master Password</label>
                        <input 
                          type="password"
                          required
                          value={formData.newPassword}
                          onChange={e => setFormData({...formData, newPassword: e.target.value})}
                          className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none"
                          placeholder="At least 6 characters"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input 
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                          className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none"
                          placeholder="Repeat new password"
                        />
                    </div>
                 </div>
              </div>

              {error && (
                <div className="bg-red-600/10 border border-red-600/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-shake">
                   <ShieldAlert className="w-5 h-5 shrink-0" />
                   {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-600/10 border border-emerald-600/20 p-4 rounded-xl flex items-center gap-3 text-emerald-500 text-sm">
                   <CheckCircle2 className="w-5 h-5 shrink-0" />
                   {success}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-red-600/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Commit Password Change
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
