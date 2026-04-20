"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Lock, User, Building2, Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function EmployeeLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Try to get slug from multiple sources
  const slugFromUrl = searchParams.get("slug") || 
                    (pathname.endsWith("-employee") ? pathname.replace("-employee", "").split("/").pop() : "");

  const [slug, setSlug] = useState(slugFromUrl || "");
  const [companyName, setCompanyName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [employeeImage, setEmployeeImage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(!!slugFromUrl);
  const [fetchingAvatar, setFetchingAvatar] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Resolution effect for branded URLs
  useEffect(() => {
    if (slugFromUrl) {
      resolveBranding(slugFromUrl);
    }
  }, [slugFromUrl]);

  // Real-time avatar resolution
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (slug && employeeCode.length >= 2) {
      timer = setTimeout(() => {
        fetchAvatar(slug, employeeCode);
      }, 500);
    } else {
      setEmployeeImage("");
    }
    return () => clearTimeout(timer);
  }, [employeeCode, slug]);

  async function fetchAvatar(slugCode: string, empCode: string) {
    try {
      setFetchingAvatar(true);
      const res = await fetch(`/api/public/employee-avatar/${slugCode}/${empCode}`);
      if (res.ok) {
        const data = await res.json();
        setEmployeeImage(data.image || "");
        if (data.name) setCompanyName(data.name); // Show individual name as secondary branding
      } else {
        setEmployeeImage("");
      }
    } catch (err) {
      setEmployeeImage("");
    } finally {
      setFetchingAvatar(false);
    }
  }

  async function resolveBranding(code: string) {
    try {
      setResolving(true);
      setNotFound(false);
      const res = await fetch(`/api/tenant/resolve/${code.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.companyName);
        setSlug(data.slug);
      } else if (res.status === 404) {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Employee portal branding resolution failed", err);
    } finally {
      setResolving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug) {
      setError("Company identity is missing. Please use your unique company link.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, employeeCode, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Invalid credentials.");
        return;
      }

      router.push("/employee/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // --- Render Switch for Context States ---

  // 1. Missing Slug State
  if (!slugFromUrl && !resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] p-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
        <div className="relative w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center border border-orange-500/20 mx-auto text-orange-500 mb-2 shadow-[0_0_40px_rgba(249,115,22,0.1)]">
                 <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Missing Company Context</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  To access the employee portal, you must use your company's unique login link. 
                  (e.g., <span className="text-indigo-400 font-mono">/yourcompany-employee</span>)
                </p>
              </div>
              <div className="pt-4">
                 <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-6">Contact your HR for the correct URL</p>
                 <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 w-4 h-4" /> Go Back
                 </Button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // 2. Company Not Found State
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] p-4 text-center">
        <div className="relative w-full max-w-md space-y-8">
           <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 mx-auto text-red-500 mb-2">
                 <Building2 size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Company Not Found</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                   We couldn't find any company associated with <span className="text-red-400 font-bold">"{slugFromUrl}"</span>. 
                   Please verify the URL and try again.
                </p>
              </div>
              <div className="pt-4">
                 <Button className="w-full h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white" onClick={() => window.location.reload()}>
                   Try Again
                 </Button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // 3. Main Login Form (Branded)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] p-4 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-[2rem] bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 mb-6 shadow-[0_0_50px_rgba(99,102,241,0.15)] ring-8 ring-indigo-500/5 overflow-hidden transition-all duration-700 group hover:scale-105">
            {employeeImage ? (
              <img src={employeeImage} alt="Profile" className="w-full h-full object-cover animate-in zoom-in duration-500" />
            ) : fetchingAvatar ? (
               <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
            ) : (
              <User className="h-10 w-10 text-indigo-400" />
            )}
          </div>
          {resolving ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-white/5 w-40 mx-auto rounded-full"></div>
              <div className="h-4 bg-white/5 w-64 mx-auto rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-indigo-400 text-[10px] uppercase tracking-[0.4em] font-black opacity-80">
                {companyName || "AppDevs Portal"}
              </p>
              <h1 className="text-4xl font-black text-white tracking-tight">Employee Portal</h1>
              <p className="text-slate-500 text-xs font-medium tracking-wide mt-2">SECURE END-TO-END ACCESS</p>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl text-left ring-1 ring-white/5">
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
            
            {/* Employee Code */}
            <div className="space-y-2">
              <label htmlFor="employeeCode" className="block text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">
                Employee Identity
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                   <User size={18} />
                </div>
                <input
                  id="employeeCode"
                  name="employeeCode"
                  type="text"
                  required
                  value={employeeCode}
                  onChange={e => setEmployeeCode(e.target.value)}
                  placeholder="Employee Code"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">
                Secure AccessKey
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-14 py-4 rounded-2xl bg-black/40 border border-white/5 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-4 text-[11px] text-red-400 font-bold flex items-center gap-3 animate-in fade-in duration-300">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resolving}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:text-indigo-300 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_15px_30px_-5px_rgba(99,102,241,0.3)] active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <Loader2 size={16} className="animate-spin" />
                   AUTHENTICATING...
                </div>
              ) : "Sign In to Portal"}
            </button>
          </form>
        </div>

        <div className="mt-12 space-y-4">
           <div className="h-px w-20 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent mx-auto"></div>
           <p className="text-center text-slate-600 text-[9px] uppercase tracking-[0.3em] font-black">
             © {new Date().getFullYear()} {companyName || "AppDevs"} · Digital Infrastructure
           </p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
        <div className="relative">
           <div className="w-16 h-16 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-pulse"></div>
           </div>
        </div>
      </div>
    }>
      <EmployeeLoginContent />
    </Suspense>
  );
}

