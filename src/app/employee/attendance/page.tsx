"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Activity, ClockIcon, UserX, Plus, MessageSquare, Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EmployeeAttendancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<any>({ summary: null, records: [] });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    checkIn: "09:00",
    checkOut: "18:30",
    reason: ""
  });

  useEffect(() => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    setLoading(true);

    fetch(`/api/employee/attendance?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      });
  }, [currentDate]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/employee/attendance-requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dateParts = formData.date.split("-");
      const checkInParts = formData.checkIn.split(":");
      const checkOutParts = formData.checkOut.split(":");

      const checkInDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(checkInParts[0]),
        parseInt(checkInParts[1])
      );

      const checkOutDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(checkOutParts[0]),
        parseInt(checkOutParts[1])
      );

      const res = await fetch("/api/employee/attendance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(formData.date).toISOString(),
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          reason: formData.reason,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ ...formData, reason: "" });
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit request");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openRequestModal = (dateStr: string) => {
    setFormData({
      ...formData,
      date: format(new Date(dateStr), "yyyy-MM-dd"),
      reason: ""
    });
    setIsModalOpen(true);
  };

  const summary = data.summary || {};
  const records = data.records || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Attendance</h1>
          <p className="text-slate-500">Track your daily punch records and averages</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-xl transition shadow-sm">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-700 min-w-[120px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-xl transition shadow-sm">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {!loading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Activity className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Present</p>
              <p className="text-xl font-bold text-slate-800">{summary.presentCount}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl"><UserX className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Absent</p>
              <p className="text-xl font-bold text-slate-800">{summary.absentCount}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><ClockIcon className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-slate-500">Avg. Working Time</p>
              <p className="text-xl font-bold text-slate-800">{summary.avgWorkingHours}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><Activity className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-slate-500">Req. Working Time</p>
              <p className="text-xl font-bold text-slate-800">{summary.reqWorkingTime || "09:00"} <span className="text-sm font-normal text-slate-500">Hours</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 ml-1 flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-600" /> Recent Daily Records
        </h2>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="animate-pulse p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Date</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Status</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Check In</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Check Out</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Note</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record: any) => {
                    const isUpcoming = record.status === "UPCOMING";
                    const isWeekendOrHoliday = ["WEEKEND", "HOLIDAY"].includes(record.status);
                    const isMissingPunches = record.status === "PRESENT" && (!record.checkIn || !record.checkOut);
                    const isAbsent = record.status === "ABSENT";
                    
                    const hasPendingOrApprovedRequest = requests.some(req => 
                      format(new Date(req.date), "yyyy-MM-dd") === format(new Date(record.date), "yyyy-MM-dd") &&
                      (req.status === "PENDING" || req.status === "APPROVED")
                    );

                    const canRequest = !isUpcoming && !isWeekendOrHoliday && (isAbsent || isMissingPunches) && !hasPendingOrApprovedRequest;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center font-medium text-slate-800">
                            <CalendarDays className="h-4 w-4 mr-2 text-indigo-400" />
                            {format(new Date(record.date), "dd MMM, yyyy")}
                            <span className="ml-2 text-xs text-slate-400 font-normal">
                              {format(new Date(record.date), "EEE")}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            record.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                            record.status === "ABSENT" ? "bg-red-100 text-red-700" :
                            record.status === "LATE" ? "bg-amber-100 text-amber-700" :
                            record.status === "WEEKEND" ? "bg-slate-800 text-slate-200" :
                            record.status === "HOLIDAY" ? "bg-purple-100 text-purple-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {record.checkIn ? (
                            <div className="flex items-center text-slate-600">
                              <Clock className="h-4 w-4 mr-2 text-slate-400" />
                              {format(new Date(record.checkIn), "hh:mm a")}
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-4 px-6">
                          {record.checkOut ? (
                            <div className="flex items-center text-slate-600">
                              <Clock className="h-4 w-4 mr-2 text-slate-400" />
                              {format(new Date(record.checkOut), "hh:mm a")}
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-sm">
                          {record.note || "-"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {canRequest && (
                            <button 
                              onClick={() => openRequestModal(record.date)}
                              className="p-2 hover:bg-brand-50 text-slate-400 hover:text-brand-600 rounded-lg transition-all shadow-sm border border-transparent hover:border-brand-100"
                              title="Request Manual Attendance"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {hasPendingOrApprovedRequest && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">
                              Requested
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No attendance records found for this month.
            </div>
          )}
        </div>
      </div>

      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 ml-1 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" /> Manual Requests Status
          </h2>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Date</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Requested Times</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Reason</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Status</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">HR Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {format(new Date(req.date), "dd MMM, yyyy")}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{req.checkIn ? format(new Date(req.checkIn), "hh:mm a") : "-"}</span>
                          <span className="text-slate-400">to</span>
                          <span className="font-bold text-slate-900">{req.checkOut ? format(new Date(req.checkOut), "hh:mm a") : "-"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-sm max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                          req.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-sm italic">
                        {req.hrNote || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={isModalOpen} title="Request Manual Attendance" onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Date of Attendance</label>
              <Input 
                type="date" 
                required 
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Check In</label>
                 <Input 
                   type="time" 
                   required
                   value={formData.checkIn}
                   onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Check Out</label>
                 <Input 
                   type="time" 
                   required
                   value={formData.checkOut}
                   onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                 />
               </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Reason for Request</label>
            <Textarea 
              placeholder="Explain why you missed the punch (e.g., finger didn't read, out of office for meeting, etc.)"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
