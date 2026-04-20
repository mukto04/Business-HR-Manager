"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Building2, 
  Database, 
  Plus, 
  Power, 
  PowerOff, 
  Search, 
  Loader2, 
  Trash2,
  RefreshCcw,
  ShieldX,
  History,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  X,
  Clock,
  CalendarDays,
  Coins,
  CreditCard,
  Receipt,
  FileSpreadsheet
} from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  companyName: string;
  dbUrl: string;
  status: string;
  planName?: string;
  permissions?: any;
  employeeLimit?: number;
  adminUsername: string;
  adminPassword?: string;
  subscriptionEnd?: string;
  createdAt: string;
}

export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dbTestStatus, setDbTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [dbTestMessage, setDbTestMessage] = useState("");

  const [formData, setFormData] = useState({
    slug: "",
    companyName: "",
    dbUrl: "",
    planName: "Starter",
    adminUsername: "admin",
    adminPassword: "",
    subscriptionDays: "30",
    employeeLimit: 50
  });

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/super-admin/companies");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTenants(data);
      } else {
        console.error("Received non-array tenants data:", data);
        setTenants([]);
      }
    } catch (e) {
      console.error("Fetch tenants failed");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(tenant: Tenant, newStatus: string) {
    const actionText = newStatus === "DELETED" ? "move to trash" : newStatus === "ACTIVE" ? "restore" : "change status";
    if (!confirm(`Are you sure you want to ${actionText} ${tenant.companyName}?`)) return;

    try {
      const res = await fetch("/api/super-admin/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, status: newStatus }),
      });
      if (res.ok) fetchTenants();
    } catch (e) {
      alert("Failed to update status");
    }
  }

  async function toggleFreeze(tenant: Tenant) {
    const newStatus = tenant.status === "ACTIVE" ? "FROZEN" : "ACTIVE";
    updateStatus(tenant, newStatus);
  }

  async function hardDelete(tenant: Tenant) {
    if (!confirm(`WARNING: This will PERMANENTLY delete ${tenant.companyName}. This action cannot be undone. Proceed?`)) return;

    try {
      const res = await fetch(`/api/super-admin/companies?id=${tenant.id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchTenants();
      else alert("Delete failed");
    } catch (e) {
      alert("Error deleting tenant");
    }
  }

  async function testDbConnection() {
    if (!formData.dbUrl) {
      setDbTestMessage("Please enter a connection string first.");
      setDbTestStatus("error");
      return;
    }
    setDbTestStatus("testing");
    setDbTestMessage("");
    try {
      const res = await fetch("/api/super-admin/test-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbUrl: formData.dbUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setDbTestStatus("success");
        setDbTestMessage(data.message || "Connection successful!");
      } else {
        setDbTestStatus("error");
        setDbTestMessage(data.message || "Connection failed.");
      }
    } catch (e) {
      setDbTestStatus("error");
      setDbTestMessage("Network error. Could not test connection.");
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = "/api/super-admin/companies";
      const method = editingTenant ? "PUT" : "POST";
      const body = editingTenant ? { id: editingTenant.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      setShowModal(false);
      setEditingTenant(null);
      setDbTestStatus("idle");
      setDbTestMessage("");
      setFormData({ 
        slug: "", 
        companyName: "", 
        dbUrl: "", 
        planName: "Starter",
        adminUsername: "admin", 
        adminPassword: "",
        subscriptionDays: "30",
        employeeLimit: 50
      });
      fetchTenants();
    } catch (e: any) {
      alert(e.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(tenant: Tenant) {
    setEditingTenant(tenant);
    setFormData({
      slug: tenant.slug,
      companyName: tenant.companyName,
      dbUrl: tenant.dbUrl,
      adminUsername: tenant.adminUsername,
      adminPassword: tenant.adminPassword || "",
      planName: tenant.planName || "Starter",
      subscriptionDays: "0",
      employeeLimit: tenant.employeeLimit || 50
    });
    setShowModal(true);
  }

  const activeTenants = Array.isArray(tenants) ? tenants.filter(t => t.status !== "DELETED") : [];
  const deletedTenants = Array.isArray(tenants) ? tenants.filter(t => t.status === "DELETED") : [];

  const displayTenants = (activeTab === "ACTIVE" ? activeTenants : deletedTenants).filter(t => 
    t.companyName.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Stats / Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === "ACTIVE" ? "Active Subscriptions" : "Account History (Trash)"}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === "ACTIVE" 
                ? `Managing ${activeTenants.length} live instances` 
                : `${deletedTenants.length} records available for recovery`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mr-4">
               <button 
                onClick={() => setActiveTab("ACTIVE")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "ACTIVE" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
               >
                 <CheckCircle2 className="w-3.5 h-3.5" /> Active
                 <span className="bg-slate-700 px-1.5 rounded text-[10px]">{activeTenants.length}</span>
               </button>
               <button 
                onClick={() => setActiveTab("HISTORY")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "HISTORY" ? "bg-slate-800 text-red-500 shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
               >
                 <History className="w-3.5 h-3.5" /> History
                 <span className="bg-slate-700 px-1.5 rounded text-[10px]">{deletedTenants.length}</span>
               </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                placeholder="Search index..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all w-48"
              />
            </div>
            <button 
              onClick={() => {
                setEditingTenant(null);
                setFormData({ 
                  slug: "", 
                  companyName: "", 
                  dbUrl: "", 
                  planName: "Starter",
                  adminUsername: "admin", 
                  adminPassword: "",
                  subscriptionDays: "30",
                  employeeLimit: 50
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-white text-black font-semibold px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Company
            </button>
          </div>
        </div>

        {/* Instances Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-slate-400 text-xs font-semibold uppercase tracking-widest border-b border-slate-800">
                <th className="px-6 py-4">Company & Login URL</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Package</th>
                <th className="px-6 py-4 text-center">Validity</th>
                <th className="px-6 py-4 text-right">Service Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                 <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600" />
                    </td>
                 </tr>
              ) : displayTenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-500 italic">No records found for current segment.</td>
                </tr>
              ) : displayTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-slate-300">
                        {tenant.slug.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{tenant.companyName}</div>
                        <div className="text-xs text-slate-500 font-mono tracking-tighter">URL: /{tenant.slug}-hr</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {(() => {
                      const daysLeft = getDaysLeft(tenant.subscriptionEnd);
                      const isExpired = daysLeft <= 0;
                      
                      if (isExpired) return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Expired / Frozen
                        </span>
                      );
                      
                      if (tenant.status === "ACTIVE") return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Service Active
                        </span>
                      );

                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Frozen
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${
                      tenant.planName === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      tenant.planName === 'Growth' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {tenant.planName || 'Starter'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {(() => {
                      const daysLeft = getDaysLeft(tenant.subscriptionEnd);
                      const isNear = daysLeft > 0 && daysLeft <= 7;
                      return (
                        <div className="space-y-1">
                          <div className={`text-sm font-bold ${daysLeft > 7 ? 'text-slate-300' : daysLeft > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                            {daysLeft > 0 ? (
                              <span className="flex items-center justify-center gap-1">
                                {isNear && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                                {daysLeft} Days Left
                              </span>
                            ) : "End of Service"}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Ends: {tenant.subscriptionEnd ? new Date(tenant.subscriptionEnd).toLocaleDateString() : "Never"}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {activeTab === "ACTIVE" ? (
                         <>
                           <button 
                            onClick={() => {
                               setEditingTenant(tenant);
                               setShowServicesModal(true);
                            }}
                            className="p-2 transition-all bg-slate-800 text-orange-500 hover:bg-orange-500/10 rounded-lg"
                            title="Manage Services"
                           >
                            <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => openEditModal(tenant)}
                            className="p-2 transition-all bg-slate-800 text-blue-500 hover:bg-blue-500/10 rounded-lg"
                            title="Edit Core Settings"
                           >
                            <Database className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => toggleFreeze(tenant)}
                            className={`p-2 rounded-lg transition-all ${
                              tenant.status === "ACTIVE" 
                              ? "bg-slate-800 text-yellow-500 hover:bg-yellow-500/10" 
                              : "bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/40"
                            }`}
                            title={tenant.status === "ACTIVE" ? "Freeze Account" : "Unfreeze"}
                           >
                            {tenant.status === "ACTIVE" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                           </button>
                           <button 
                            onClick={() => updateStatus(tenant, "DELETED")}
                            className="p-2 bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Move to Trash"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </>
                       ) : (
                         <>
                           <button 
                            onClick={() => updateStatus(tenant, "ACTIVE")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-green-500 hover:bg-green-500/10 rounded-lg text-xs font-bold transition-all"
                           >
                             <RefreshCcw className="w-3.5 h-3.5" /> Restore
                           </button>
                           <button 
                            onClick={() => hardDelete(tenant)}
                            className="p-2 bg-slate-800 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            title="Permanent Delete"
                           >
                             <ShieldX className="w-4 h-4" />
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Manual Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setDbTestStatus("idle"); setDbTestMessage(""); } }}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" style={{maxHeight: 'calc(100vh - 2rem)'}}>
            {/* Modal Header - Fixed */}
            <div className="bg-slate-800 px-8 py-5 flex items-center justify-between border-b border-slate-700 rounded-t-3xl flex-shrink-0">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-red-500" /> {editingTenant ? "Edit Tenant Profile" : "Onboard New Tenant"}
               </h3>
               <button onClick={() => { setShowModal(false); setDbTestStatus("idle"); setDbTestMessage(""); }} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-8">
              <form id="tenant-form" onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company Name</label>
                    <input 
                      required 
                      placeholder="Apple Inc."
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Login URL Slug (Branding)</label>
                    <div className="flex items-center bg-black border border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-600 transition-all">
                      <span className="pl-4 text-slate-500 font-mono text-sm select-none">/</span>
                      <input 
                        required 
                        placeholder="apple"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().trim().replace(/\s+/g, "-")})}
                        className="w-full bg-transparent px-2 py-2.5 text-white outline-none font-mono" />
                      <span className="pr-4 py-2.5 bg-slate-800/50 text-red-500 font-bold font-mono text-sm select-none border-l border-slate-700 whitespace-nowrap">
                        -hr
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 px-1">Unique login URL: /{formData.slug || "company"}-hr</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">MongoDB Connection String</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      placeholder="mongodb+srv://..."
                      value={formData.dbUrl}
                      onChange={(e) => { setFormData({...formData, dbUrl: e.target.value}); setDbTestStatus("idle"); setDbTestMessage(""); }}
                      className="flex-1 bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono text-xs min-w-0" />
                    <button
                      type="button"
                      onClick={testDbConnection}
                      disabled={dbTestStatus === "testing" || !formData.dbUrl}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                    >
                      {dbTestStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                      Test
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 px-1">Must include database name after .net/ (e.g. /hr_db?appName=...)</p>
                  {/* DB Test Result */}
                  {dbTestStatus !== "idle" && dbTestMessage && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                      dbTestStatus === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                      dbTestStatus === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {dbTestStatus === "success" ? <Wifi className="w-3.5 h-3.5 flex-shrink-0" /> : <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />}
                      {dbTestMessage}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subscription Package</label>
                    <select 
                      value={formData.planName}
                      onChange={(e) => setFormData({...formData, planName: e.target.value})}
                      className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold"
                    >
                      <option value="Starter">Starter Plan</option>
                      <option value="Growth">Growth Plan</option>
                      <option value="Enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Extension (Days)</label>
                    <select 
                      value={formData.subscriptionDays}
                      onChange={(e) => setFormData({...formData, subscriptionDays: e.target.value})}
                      className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    >
                      <option value="0">Unchanged</option>
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">1 Year</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Employee Limit</label>
                    <input 
                      type="number"
                      value={formData.employeeLimit}
                      onChange={(e) => setFormData({...formData, employeeLimit: parseInt(e.target.value) || 0})}
                      className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initial Admin Username</label>
                    <input 
                      required 
                      value={formData.adminUsername}
                      onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
                      className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initial Admin Password</label>
                    <div className="relative">
                      <input 
                        required 
                        type={showPassword ? "text" : "password"}
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                        className="w-full bg-black border border-slate-700 rounded-xl pl-4 pr-12 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>


              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="px-8 py-5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/80 rounded-b-3xl flex-shrink-0">
               <button 
                type="button"
                onClick={() => { setShowModal(false); setDbTestStatus("idle"); setDbTestMessage(""); }}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
               <button 
                type="submit"
                form="tenant-form"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (editingTenant ? "Save Changes" : "Deploy Instance")}
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Manage Services Modal */}
      {showServicesModal && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) setShowServicesModal(false); }}>
           <div className="bg-[#0B0F1A] border border-white/10 rounded-[3rem] w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh]">
              {/* Premium Header */}
              <div className="relative p-8 pb-6 overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                          <ShieldCheck className="w-6 h-6 text-orange-500" />
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-white tracking-tight">Access Control</h3>
                          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-0.5">Instance: {editingTenant.slug}</p>
                       </div>
                    </div>
                    <button onClick={() => setShowServicesModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
              </div>

              {/* Service List with Custom Scrollbar */}
              <div className="flex-1 overflow-y-auto px-8 py-2 space-y-3 custom-scrollbar">
                 {[
                   { id: 'attendance', label: 'Attendance & Reporting', desc: 'Punch logs & employee reports', icon: Clock },
                   { id: 'leaves', label: 'Leave Management', desc: 'Balances & approval workflow', icon: CalendarDays },
                   { id: 'payroll', label: 'Payroll & Salary', desc: 'Structures & monthly slips', icon: Coins },
                   { id: 'loans', label: 'Loans & Advances', desc: 'Financial assistance tracking', icon: CreditCard },
                   { id: 'costs', label: 'Office Cost Tracking', desc: 'Daily expense management', icon: Receipt },
                   { id: 'spreadsheets', label: 'Company Spreadsheet', desc: 'External Google Sheets sync', icon: FileSpreadsheet },
                 ].map((service) => {
                    const isEnabled = editingTenant.permissions?.[service.id] !== false;
                    return (
                      <div key={service.id} className="group relative flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                         <div className="flex items-center gap-4">
                           <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${isEnabled ? 'bg-orange-500/5 border-orange-500/10 text-orange-500' : 'bg-slate-800/50 border-slate-700/50 text-slate-600'}`}>
                             {service.icon ? <service.icon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                           </div>
                           <div className="space-y-0.5">
                              <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{service.label}</div>
                              <div className="text-[9px] text-slate-500 font-medium">{service.desc}</div>
                           </div>
                         </div>
                         <button 
                           onClick={async () => {
                              const defaultPerms = {
                                attendance: true,
                                leaves: true,
                                payroll: true,
                                loans: true,
                                advances: true,
                                costs: true,
                                spreadsheets: true
                              };
                              const currentPerms = (editingTenant.permissions && typeof editingTenant.permissions === 'object') ? editingTenant.permissions : defaultPerms;
                              const newPermissions = { ...defaultPerms, ...currentPerms, [service.id]: !isEnabled };

                              try {
                                const res = await fetch("/api/super-admin/companies", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: editingTenant.id, permissions: newPermissions }),
                                });
                                if (res.ok) {
                                  setEditingTenant({ ...editingTenant, permissions: newPermissions });
                                  fetchTenants();
                                }
                              } catch (e) {
                                alert("Update failed");
                              }
                           }}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-offset-2 ring-offset-[#0B0F1A] ${isEnabled ? 'bg-orange-600 ring-orange-500/20' : 'bg-slate-800 ring-transparent'}`}
                         >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-all duration-300 ${isEnabled ? 'translate-x-[1.375rem]' : 'translate-x-1'}`} />
                         </button>
                      </div>
                    );
                 })}
              </div>

              {/* Quota Footer */}
              <div className="p-8 pt-6">
                 <div className="relative group p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-[2.5rem] overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.15em]">Employee Quota</div>
                        <div className="text-xs text-slate-400 font-medium max-w-[120px] leading-tight">Total active seats allowed</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          id="employee-limit-input"
                          defaultValue={editingTenant.employeeLimit || 50}
                          className="w-16 bg-black/40 border border-white/10 rounded-2xl px-2 py-3 text-center text-white font-black text-lg outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
                        />
                        <button
                          onClick={async () => {
                            const input = document.getElementById('employee-limit-input') as HTMLInputElement;
                            const newLimit = parseInt(input.value) || 0;
                            try {
                              const res = await fetch("/api/super-admin/companies", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: editingTenant.id, employeeLimit: newLimit }),
                              });
                              if (res.ok) {
                                setEditingTenant({ ...editingTenant, employeeLimit: newLimit });
                                fetchTenants();
                              }
                            } catch (e) {
                              alert("Failed to update limit");
                            }
                          }}
                          className="h-12 px-6 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black tracking-widest rounded-2xl transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(234,88,12,0.3)] active:scale-95"
                        >
                          SAVE
                        </button>
                      </div>
                    </div>
                 </div>
                 <div className="mt-6 text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] opacity-40">
                      Syncing live permissions across instances
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

