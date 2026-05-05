"use client";

import React, { useState, useEffect } from "react";
import { format, differenceInCalendarDays, eachDayOfInterval, isWeekend } from "date-fns";
import { Coffee, Calendar, History, PieChart, Plus, X, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Modal } from "@/components/ui/modal";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LeaveRequestItem {
  id: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  hrNote?: string;
  createdAt: string;
}

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const map: Record<RequestStatus, string> = {
    PENDING: "bg-amber-50 text-amber-600 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
  };
  const icons: Record<RequestStatus, React.ReactNode> = {
    PENDING: <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle2 className="w-3 h-3" />,
    REJECTED: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${map[status]}`}>
      {icons[status]} {status}
    </span>
  );
};

export default function EmployeeLeavesPage() {
  const [data, setData] = useState<{ leaveBalance: any; leaveRecords: any[] }>({ leaveBalance: null, leaveRecords: [] });
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", isHalfDay: false, reason: "" });
  const [empInfo, setEmpInfo] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/employee/leaves").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    fetch("/api/employee/requests?type=leave").then(r => r.json()).then(setRequests);
    fetch("/api/employee/me").then(r => r.json()).then(setEmpInfo);
  }, []);

  const calcDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    if (form.isHalfDay) return 0.5;
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (to < from) return 0;
    const days = eachDayOfInterval({ start: from, end: to }).filter(d => !isWeekend(d)).length;
    return days;
  };

  const days = calcDays();

  const handleSubmit = async () => {
    if (!form.reason || days === 0) return;
    setSubmitting(true);
    const res = await fetch("/api/employee/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "leave",
        fromDate: form.fromDate,
        toDate: form.isHalfDay ? form.fromDate : form.toDate,
        days,
        reason: form.reason,
        employeeName: empInfo?.name || "Employee",
      })
    });
    if (res.ok) {
      fetch("/api/employee/requests?type=leave").then(r => r.json()).then(setRequests);
      setShowModal(false);
      setForm({ fromDate: "", toDate: "", isHalfDay: false, reason: "" });
    }
    setSubmitting(false);
  };

  const { leaveBalance } = data;
  const leaveRecords = data.leaveRecords || [];
  const used = leaveBalance ? (leaveBalance.totalLeave - leaveBalance.dueLeave) : 0;

  if (loading) return <div className="space-y-8 animate-pulse w-full"><div className="h-24 bg-slate-100 rounded-2xl" /></div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t("Leave Balance")}</h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">{t("Overview of your yearly assigned and remaining leave quotas.")}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          {t("Apply for Leave")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-4 space-y-6">
          {leaveBalance ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><PieChart size={20} /></div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Fiscal Year")}</p>
                <h3 className="text-xl font-bold text-slate-900">{leaveBalance.year}</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("Total Quota")}</p>
                    <p className="text-2xl font-bold text-slate-900">{leaveBalance.totalLeave} {t("Days")}</p>
                  </div>
                  <div className="h-10 w-px bg-slate-100" />
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{t("Available")}</p>
                    <p className="text-2xl font-bold text-emerald-600">{leaveBalance.dueLeave} {t("Days")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("Used")}</p>
                    <p className="text-xs font-bold text-slate-700">{used} / {leaveBalance.totalLeave} {t("Days")}</p>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((used / (leaveBalance.totalLeave || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-200"><Coffee size={28} /></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t("No active leave policies found for your account.")}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* My Applications */}
          {requests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-500" /> {t("My Applications")}
              </h2>
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.id} className={`bg-white rounded-2xl border p-5 shadow-sm flex items-center justify-between gap-4 ${
                    req.status === "PENDING" ? "border-amber-100" : "border-slate-100"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Calendar size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {format(new Date(req.fromDate), "dd MMM")} — {format(new Date(req.toDate), "dd MMM yyyy")}
                          <span className="ml-2 text-[10px] text-slate-400 font-medium">({req.days} {req.days <= 1 ? "Day" : "Days"})</span>
                        </p>
                        <p className="text-xs text-slate-400 font-medium line-clamp-1">{req.reason}</p>
                        {req.hrNote && <p className="text-xs text-rose-500 font-medium mt-0.5">HR: {req.hrNote}</p>}
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Table */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <History size={16} className="text-indigo-600" /> {t("Usage History")}
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Period")}</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Days")}</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Reason")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leaveRecords.length > 0 ? leaveRecords.map((record: any) => (
                      <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Calendar size={14} /></div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{format(new Date(record.date), "dd MMM")}{record.toDate && record.toDate !== record.date && ` - ${format(new Date(record.toDate), "dd MMM")}`}</p>
                              <p className="text-[10px] font-medium text-slate-400">{format(new Date(record.date), "yyyy")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{record.amount} {record.amount > 1 ? t("Days") : t("Day")}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">{record.reason || "---"}</p>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="py-20 text-center"><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t("NO RECORDS")}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t("Apply for Leave")}
        description={t("Submit a leave request for HR approval.")}
      >
        <div className="space-y-5">
          {/* Half Day Toggle */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer group">
            <input
              type="checkbox"
              checked={form.isHalfDay}
              onChange={e => setForm({ ...form, isHalfDay: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm font-bold text-slate-700">{t("Half Day Leave (0.5 day)")}</span>
          </label>

          {/* From Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{form.isHalfDay ? t("Date") : t("From Date")}</label>
            <input
              type="date"
              value={form.fromDate}
              onChange={e => setForm({ ...form, fromDate: e.target.value })}
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* To Date (only if not half day) */}
          {!form.isHalfDay && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t("To Date")}</label>
              <input
                type="date"
                value={form.toDate}
                min={form.fromDate}
                onChange={e => setForm({ ...form, toDate: e.target.value })}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          )}

          {/* Days Preview */}
          {days > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl">
              <Calendar className="w-4 h-4 text-brand-600" />
              <p className="text-sm font-bold text-brand-700">{days} {days === 0.5 ? t("Half Day") : days === 1 ? t("Day") : t("Days")} {t("of leave")}</p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t("Reason")}</label>
            <textarea
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder={t("Explain the reason for your leave...")}
              rows={3}
              className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-2xl transition-all">
              {t("Cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.reason || days === 0}
              className="flex-1 h-11 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? t("Submitting...") : t("Submit Request")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
