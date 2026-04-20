"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight, 
  Settings2,
  Trash2,
  Calendar,
  Tag,
  FileText,
  Loader2,
  X,
  CreditCard,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { getJson, sendJson } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  _count?: { transactions: number };
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  details: string;
  category: Category;
}

export function CostLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [prevBalance, setPrevBalance] = useState(0);

  const [txForm, setTxForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    categoryId: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    details: ""
  });

  const [catForm, setCatForm] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    color: "#4f46e5"
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  async function fetchData() {
    setLoading(true);
    try {
      const [txData, catData] = await Promise.all([
        getJson<{ transactions: Transaction[], previousBalance: number }>(`/api/office-cost/transactions?month=${selectedMonth}&year=${selectedYear}`),
        getJson<Category[]>("/api/office-cost/categories")
      ]);
      setTransactions(txData.transactions);
      setPrevBalance(txData.previousBalance);
      setCategories(catData);
      
      if (catData.length > 0 && !txForm.categoryId) {
        setTxForm(prev => ({ ...prev, categoryId: catData[0].id }));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendJson("/api/office-cost/transactions", "POST", {
        ...txForm,
        amount: parseFloat(txForm.amount)
      });
      setShowAddModal(false);
      setTxForm({ ...txForm, amount: "", details: "" });
      fetchData();
    } catch (error) {
      alert("Failed to save transaction");
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendJson("/api/office-cost/categories", "POST", catForm);
      setCatForm({ ...catForm, name: "" });
      fetchData();
    } catch (error) {
      alert("Failed to create category");
    }
  }

  async function deleteTransaction(id: string) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await sendJson(`/api/office-cost/transactions?id=${id}`, "DELETE", {});
      fetchData();
    } catch (error) {
      alert("Delete failed");
    }
  }

  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === "INCOME") acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const currentBalance = prevBalance + totals.income - totals.expense;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Global Office Costing"
        subtitle="Manage flexible expenses and income with dynamic categories."
        actions={
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setShowCategoryModal(true)} className="rounded-2xl border-slate-200">
               <Settings2 className="w-4 h-4 mr-2" /> Categories
             </Button>
             <Button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
               <Plus className="w-4 h-4 mr-2" /> Add Transaction
             </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening Balance</span>
            </div>
            <div className="text-2xl font-black text-slate-900">৳{prevBalance.toLocaleString()}</div>
         </div>

         <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Income</span>
            </div>
            <div className="text-2xl font-black text-emerald-600">৳{totals.income.toLocaleString()}</div>
         </div>

         <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <ArrowDownRight className="w-6 h-6 text-rose-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expense</span>
            </div>
            <div className="text-2xl font-black text-rose-600">৳{totals.expense.toLocaleString()}</div>
         </div>

         <div className="bg-slate-900 p-6 rounded-[32px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <CreditCard className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Closing Balance</div>
               <div className="text-3xl font-black text-white">৳{currentBalance.toLocaleString()}</div>
            </div>
         </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
         <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> General Ledger
            </h3>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input placeholder="Search transactions..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all" />
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                     <th className="px-8 py-4">Date</th>
                     <th className="px-8 py-4">Category</th>
                     <th className="px-8 py-4">Details</th>
                     <th className="px-8 py-4 text-right">Amount</th>
                     <th className="px-8 py-4 text-center">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-200" />
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 italic">No transactions found for this period.</td>
                    </tr>
                  ) : transactions.map(tx => (
                    <tr key={tx.id} className="group hover:bg-slate-50/80 transition-colors">
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-700">{format(new Date(tx.date), "dd MMM, yyyy")}</span>
                             <span className="text-[10px] text-slate-400 font-mono">{format(new Date(tx.date), "HH:mm")}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold shadow-sm" style={{ backgroundColor: `${tx.category?.color}15`, color: tx.category?.color, border: `1px solid ${tx.category?.color}30` }}>
                             <Tag className="w-3 h-3 mr-1" /> {tx.category?.name}
                          </span>
                       </td>
                       <td className="px-8 py-5">
                          <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{tx.details || "-"}</p>
                       </td>
                       <td className={`px-8 py-5 text-right font-black tabular-nums ${tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                          {tx.type === "INCOME" ? "+" : "-"} ৳{tx.amount.toLocaleString()}
                       </td>
                       <td className="px-8 py-5 text-center">
                          <button onClick={() => deleteTransaction(tx.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-6 h-6 text-indigo-600" /> New Transaction
                 </h3>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-all text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date</label>
                       <input type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Type</label>
                       <select value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold">
                          <option value="EXPENSE">Expense</option>
                          <option value="INCOME">Income</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
                    <select required value={txForm.categoryId} onChange={e => setTxForm({...txForm, categoryId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold">
                       {categories.map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Amount</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                       <input autoFocus type="number" required value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-black tabular-nums" placeholder="0.00" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Note (Optional)</label>
                    <textarea value={txForm.details} onChange={e => setTxForm({...txForm, details: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px]" placeholder="Add transaction details..." />
                 </div>

                 <Button type="submit" className="w-full py-6 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-xl shadow-indigo-100">
                    Save Record
                 </Button>
              </form>
           </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in zoom-in-95 duration-200">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="w-6 h-6 text-indigo-600" /> Cost Heads (Categories)
                 </h3>
                 <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-all text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-8 space-y-8">
                 {/* Create New Cat */}
                 <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input required placeholder="Category name..." value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
                    <input type="color" value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} className="w-12 h-12 rounded-2xl border-none cursor-pointer" />
                    <Button type="submit" className="rounded-2xl px-6">Add</Button>
                 </form>

                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scroll">
                    {categories.map(cat => (
                       <div key={cat.id} className="flex items-center justify-between p-4 rounded-3xl border border-slate-50 hover:border-slate-200 transition-all group">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                             <span className="font-bold text-slate-700">{cat.name}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">({cat._count?.transactions || 0} usage)</span>
                          </div>
                          {cat._count?.transactions === 0 && (
                             <button onClick={async () => {
                                await sendJson(`/api/office-cost/categories?id=${cat.id}`, "DELETE", {});
                                fetchData();
                             }} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
}
