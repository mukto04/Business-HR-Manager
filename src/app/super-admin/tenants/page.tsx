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
  Edit2
} from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  companyName: string;
  dbUrl: string;
  status: string;
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
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    companyName: "",
    dbUrl: "",
    adminUsername: "admin",
    adminPassword: "",
    subscriptionDays: "30"
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
      setFormData({ 
        slug: "", 
        companyName: "", 
        dbUrl: "", 
        adminUsername: "admin", 
        adminPassword: "",
        subscriptionDays: "30" 
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
      subscriptionDays: "0" // Default to no change when editing
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
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">AppDevs HR Master Controller</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs bg-red-600/10 text-red-500 px-3 py-1 rounded-full border border-red-600/20 font-mono">ROOT_LEVEL_ACCESS</span>
          </div>
        </div>
      </nav>

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
                  adminUsername: "admin", 
                  adminPassword: "",
                  subscriptionDays: "30" 
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
                            onClick={() => openEditModal(tenant)}
                            className="p-2 transition-all bg-slate-800 text-blue-500 hover:bg-blue-500/10 rounded-lg"
                            title="Edit Connection"
                           >
                            <Edit2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 px-8 py-6 flex items-center justify-between border-b border-slate-700">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-red-500" /> {editingTenant ? "Edit Tenant Profile" : "Onboard Tenant"}
               </h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-8 space-y-5">
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
                    <span className="pl-4 text-slate-600 font-mono text-sm select-none">/</span>
                    <input 
                      required 
                      placeholder="apple"
                      disabled={!!editingTenant}
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().trim().replace(/\s+/g, "-")})}
                      className="w-full bg-transparent px-0 py-2.5 text-white outline-none font-mono disabled:opacity-50" />
                    <span className="pr-4 text-slate-600 font-mono text-sm select-none">-hr</span>
                  </div>
                  <p className="text-[10px] text-slate-500 px-1">This defines your unique login URL e.g. /{formData.slug || "company"}-hr</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">MongoDB Connection String</label>
                <input 
                  required 
                  placeholder="mongodb+srv://..."
                  value={formData.dbUrl}
                  onChange={(e) => setFormData({...formData, dbUrl: e.target.value})}
                  className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono text-xs" />
                <p className="text-[10px] text-slate-500 px-1">Must include database name after .net/ (e.g. /hr_db?appName=...)</p>
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
                  <input 
                    required 
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                    className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subscription Duration (Add/Extend)</label>
                <select 
                  value={formData.subscriptionDays}
                  onChange={(e) => setFormData({...formData, subscriptionDays: e.target.value})}
                  className="w-full bg-black border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-red-600 transition-all"
                >
                  <option value="30">1 Month (30 Days)</option>
                  <option value="90">3 Months (90 Days)</option>
                  <option value="180">6 Months (180 Days)</option>
                  <option value="365">1 Year (365 Days)</option>
                  {editingTenant && <option value="0">Leave Unchanged</option>}
                </select>
                <p className="text-[10px] text-slate-500 px-1">
                  {editingTenant ? "Choosing a duration will extend the current expiry date." : "Initial validity from deployment date."}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                 <button 
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2">
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (editingTenant ? "Save Changes" : "Deploy Instance")}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
