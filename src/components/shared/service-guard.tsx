"use client";

import React from "react";
import { Lock, ShieldAlert, Rocket, MessageSquareText } from "lucide-react";
import { useAsyncData } from "@/modules/shared/use-async-data";

interface ServiceGuardProps {
  id: "attendance" | "leaves" | "payroll" | "loans" | "advances" | "costs";
  children: React.ReactNode;
}

export function ServiceGuard({ id, children }: ServiceGuardProps) {
  const { data: session, loading } = useAsyncData<any>("/api/me", null);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check if service is enabled (Default to true if permissions object doesn't exist yet)
  const isEnabled = session?.permissions?.[id] !== false;

  if (!isEnabled) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden text-center relative group">
           {/* Abstract Background Decoration */}
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50/50 rounded-full blur-3xl group-hover:bg-red-100/50 transition-colors" />
           
           <div className="p-12 space-y-8 relative z-10">
              <div className="inline-flex p-6 rounded-full bg-red-50 border border-red-100 animate-bounce-subtle">
                 <Lock className="w-12 h-12 text-red-600" />
              </div>

              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                   Service Locked
                 </h2>
                 <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
                   This module is not included in your current subscription plan.
                 </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 inline-block">
                 <div className="flex items-center gap-3 text-slate-700 font-bold">
                    <MessageSquareText className="w-5 h-5 text-red-600" />
                    <span>Please contact your provider to activate this module.</span>
                 </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                  onClick={() => window.location.href = `mailto:support@appdevs.pk?subject=Service Activation: ${id.toUpperCase()}`}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
                 >
                    <Rocket className="w-5 h-5" />
                    Request Activation
                 </button>
                 <button 
                  onClick={() => window.history.back()}
                  className="text-slate-500 font-bold hover:text-slate-900 px-6"
                 >
                    Go Back
                 </button>
              </div>
           </div>

           <div className="bg-slate-50 border-t border-slate-100 py-6 px-8 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Security Protocol v2.4</span>
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                 <ShieldAlert className="w-3 h-3" />
                 <span className="text-[10px] font-bold">Module ID: {id.toUpperCase()}</span>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
