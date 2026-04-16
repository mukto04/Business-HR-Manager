"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Building2 } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [companyCode, setCompanyCode] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyCode, employeeCode, password }),
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-900 p-4">
      {/* Background grid decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <p className="text-indigo-400 text-sm uppercase tracking-[0.3em] font-medium mb-1">AppDevs</p>
          <h1 className="text-2xl font-bold text-white">Employee Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to access your personal dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-5">
            {/* Company Code */}
            <div>
              <label htmlFor="companyCode" className="block text-sm font-medium text-slate-300 mb-2">
                Company Code
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="companyCode"
                  name="companyCode"
                  type="text"
                  required
                  value={companyCode}
                  onChange={e => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="Enter company code"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition uppercase font-mono"
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
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
