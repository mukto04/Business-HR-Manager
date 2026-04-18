"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Lock, User, Building2, Loader2, Eye, EyeOff } from "lucide-react";

function EmployeeLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const slugFromUrl = searchParams.get("slug") || (pathname.endsWith("-employee") ? pathname.replace("-employee", "").substring(1) : "");

  const [slug, setSlug] = useState(slugFromUrl || "");
  const [companyName, setCompanyName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(!!slugFromUrl);

  // Resolution effect for branded URLs
  useEffect(() => {
    if (slugFromUrl) {
      resolveBranding(slugFromUrl);
    }
  }, [slugFromUrl]);

  async function resolveBranding(code: string) {
    try {
      setResolving(true);
      const res = await fetch(`/api/tenant/resolve/${code.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.companyName);
        setSlug(data.slug);
      }
    } catch (err) {
      console.error("Employee portal branding resolution failed", err);
    } finally {
      setResolving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-900 p-4 text-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          {resolving ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-white/10 w-24 mx-auto rounded"></div>
              <div className="h-8 bg-white/10 w-48 mx-auto rounded"></div>
            </div>
          ) : (
            <>
              <p className="text-indigo-400 text-sm uppercase tracking-[0.3em] font-medium mb-1">
                {companyName || "AppDevs"}
              </p>
              <h1 className="text-2xl font-bold text-white">Employee Portal</h1>
              <p className="text-slate-400 text-sm mt-1">Sign in to access your personal dashboard</p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-left">
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-5">
            {/* Slug Field - Only shown if not in branded mode */}
            {!slugFromUrl && (
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-slate-300 mb-2">
                  Company Login URL Slug
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase())}
                    placeholder="E.g. appdevs"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono"
                  />
                </div>
              </div>
            )}

            {/* Employee Code */}
            <div>
              <label htmlFor="employeeCode" className="block text-sm font-medium text-slate-300 mb-2">
                Employee Code
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="employeeCode"
                  name="employeeCode"
                  type="text"
                  required
                  value={employeeCode}
                  onChange={e => setEmployeeCode(e.target.value)}
                  placeholder="Enter employee code"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resolving}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/20"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} AppDevs HR · Employee Portal
        </p>
      </div>
    </div>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <EmployeeLoginContent />
    </Suspense>
  );
}

