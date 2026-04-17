"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDialog } from "@/components/ui/dialog-provider";
import { Plus, Edit2, Trash2, RefreshCw, Search, Settings2 } from "lucide-react";
import Link from "next/link";

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dialog = useDialog();

  const [formData, setFormData] = useState({
    employeeId: "",
    checkIn: "",
    checkOut: "",
    status: "PRESENT",
    note: "",
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState({
    defaultInTime: "09:00",
    defaultOutTime: "18:00",
    avgRequestTime: "09:00"
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/attendance");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          // Normalize API data to 24-hour format if needed or retain as is. 
          // Assuming we store as "HH:mm" in DB now.
          setSettings({
            defaultInTime: data.defaultInTime || "09:00",
            defaultOutTime: data.defaultOutTime || "18:00",
            avgRequestTime: data.avgRequestTime || "09:00"
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch settings");
    }
  };

  const fetchAttendance = useCallback(async (selectedDate: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?date=${selectedDate}`);
      const data = await res.json();
      setAttendances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  useEffect(() => {
    fetchAttendance(date);
  }, [date, fetchAttendance]);

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
  }, []);

  const openNewModal = () => {
    setSelectedRecord(null);
    setFormData({ employeeId: "", checkIn: "", checkOut: "", status: "PRESENT", note: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (record: any) => {
    setSelectedRecord(record);
    
    // Get default times based on the currently selected date and settings
    const parts = date.split("-");
    const yearNum = parseInt(parts[0]);
    const monthNum = parseInt(parts[1]) - 1;
    const dayNum = parseInt(parts[2]);
    
    // Parse the settings time "HH:mm"
    const inParts = settings.defaultInTime.split(":");
    const outParts = settings.defaultOutTime.split(":");
    
    const inHour = parseInt(inParts[0] || "9");
    const inMin = parseInt(inParts[1] || "0");
    const outHour = parseInt(outParts[0] || "18");
    const outMin = parseInt(outParts[1] || "0");

    const defaultIn = format(new Date(yearNum, monthNum, dayNum, inHour, inMin, 0), "yyyy-MM-dd'T'HH:mm");
    const defaultOut = format(new Date(yearNum, monthNum, dayNum, outHour, outMin, 0), "yyyy-MM-dd'T'HH:mm");

    const checkInTime = record.checkIn ? format(new Date(record.checkIn), "yyyy-MM-dd'T'HH:mm") : defaultIn;
    const checkOutTime = record.checkOut ? format(new Date(record.checkOut), "yyyy-MM-dd'T'HH:mm") : defaultOut;
    
    setFormData({
      employeeId: record.employeeId,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status: record.status,
      note: record.note || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      dialog.alert("Error", "Please select an employee.");
      return;
    }
    setSaving(true);
    try {
      const requestData = { ...formData, isManual: true };
      if (formData.checkIn) requestData.checkIn = new Date(formData.checkIn).toISOString();
      if (formData.checkOut) requestData.checkOut = new Date(formData.checkOut).toISOString();

      if (selectedRecord && selectedRecord.id) {
        await fetch(`/api/attendance/${selectedRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      } else {
        await fetch(`/api/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...requestData, date }),
        });
      }
      setIsModalOpen(false);
      fetchAttendance(date);
    } catch (error) {
       console.error(error);
       dialog.alert("Error", "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.danger("Delete Record?", "Are you sure you want to delete this attendance record?");
    if (!confirmed) return;
    
    try {
      await fetch(`/api/attendance/${id}`, { method: "DELETE" });
      fetchAttendance(date);
    } catch (error) {
      console.error(error);
    }
  };

  const markPresent = async (record: any) => {
    try {
      setLoading(true);
      
      const parts = date.split("-");
      // Parse settings
      const inParts = settings.defaultInTime.split(":");
      const outParts = settings.defaultOutTime.split(":");
      
      const checkInDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), parseInt(inParts[0]||"9"), parseInt(inParts[1]||"0"), 0);
      const checkOutDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), parseInt(outParts[0]||"18"), parseInt(outParts[1]||"0"), 0);

      await fetch(`/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          employeeId: record.employeeId, 
          date, 
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          status: "PRESENT", 
          isManual: true 
        }),
      });
      fetchAttendance(date);
    } catch (error) {
       console.error(error);
       dialog.alert("Error", "Failed to mark attendance.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/attendance/sync-device", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        dialog.alert("Sync Successful", `Processed ${data.summary.totalLogs} logs. Synced ${data.summary.synced} records.`);
        fetchAttendance(date);
      } else {
        dialog.alert("Sync Failed", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Sync error:", error);
      dialog.alert("Sync Error", "Failed to connect to the device or server.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        dialog.alert("Success", "Attendance settings updated successfully.");
        setIsSettingsOpen(false);
      } else {
        const error = await res.json();
        dialog.alert("Error", error.message || "Failed to save settings.");
      }
    } catch (error) {
      dialog.alert("Error", "Network error when saving settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const statusColors: any = {
    PRESENT: "bg-emerald-100 text-emerald-800",
    ABSENT: "bg-red-100 text-red-800",
    LATE: "bg-amber-100 text-amber-800",
    HALF_DAY: "bg-orange-100 text-orange-800",
  };

  const summary = {
    total: attendances.length,
    present: attendances.filter(a => ["PRESENT", "LATE", "HALF_DAY"].includes(a.status)).length,
    absent: attendances.filter(a => a.status === "ABSENT").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Tracking"
        subtitle="View and manage daily attendance records"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" /> Attendance Settings
            </Button>
            <Link href="/attendance/setup">
              <Button variant="secondary">
                <Settings2 className="mr-2 h-4 w-4" /> Attendance Device Setup
              </Button>
            </Link>
            <Button onClick={openNewModal}>
              <Plus className="mr-2 h-4 w-4" /> Manual Entry
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500">Total Employees</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </Card>
        <Card className="p-4 bg-emerald-50/50">
          <p className="text-sm font-medium text-emerald-600">Present Today</p>
          <p className="text-2xl font-bold text-emerald-700">{summary.present}</p>
        </Card>
        <Card className="p-4 bg-red-50/50">
          <p className="text-sm font-medium text-red-600">Absent Today</p>
          <p className="text-2xl font-bold text-red-700">{summary.absent}</p>
        </Card>
      </div>

      <Card className="p-0 overflow-visible">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Attendance Date:</span>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-40 h-9"
            />
          </div>

          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 rounded-xl border-slate-200"
            />
          </div>

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> {summary.present} Present</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span> {summary.absent} Absent</span>
          </div>
        </div>

        <DataTable
          data={attendances.filter(a => 
            a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          loading={loading}
          columns={[
             { 
               key: "employeeCode", 
               title: "ID",
               render: (row: any) => row.employee?.employeeCode || "-"
             },
             { 
               key: "name", 
               title: "Employee Name",
               render: (row: any) => (
                 <div>
                    <p className="font-medium">{row.employee?.name || "-"}</p>
                    <p className="text-xs text-slate-500">{row.employee?.designation}</p>
                 </div>
               )
             },
             { 
               key: "checkIn", 
               title: "Check In", 
               render: (row: any) => row.checkIn ? format(new Date(row.checkIn), "hh:mm a") : "-" 
             },
             { 
               key: "checkOut", 
               title: "Check Out", 
               render: (row: any) => row.checkOut ? format(new Date(row.checkOut), "hh:mm a") : "-" 
             },
             {
               key: "status",
               title: "Status",
               render: (row: any) => (
                 <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[row.status] || statusColors.PRESENT}`}>
                      {row.status}
                    </span>
                    {row.status === "ABSENT" && (
                      <button 
                        className="h-7 px-3 py-0 text-[10px] uppercase tracking-wider rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => markPresent(row)}
                      >
                        Present
                      </button>
                    )}
                 </div>
               )
             },
             {
               key: "actions",
               title: "Actions",
               render: (row: any) => (
                 <div className="flex items-center gap-1">
                   <button 
                     onClick={() => openEditModal(row)} 
                     className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-all"
                     title="Edit"
                   >
                     <Edit2 size={18} />
                   </button>
                   {row.id && (
                     <button 
                       onClick={() => handleDelete(row.id)} 
                       className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition-all"
                       title="Delete"
                     >
                       <Trash2 size={18} />
                     </button>
                   )}
                 </div>
               )
             }
          ]}
        />
      </Card>

      <Modal open={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title={selectedRecord ? "Edit Attendance" : "Manual Attendance"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Employee</label>
            <Select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              disabled={!!selectedRecord}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Check In Time</label>
              <Input
                type="datetime-local"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Check Out Time</label>
              <Input
                type="datetime-local"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select
               value={formData.status}
               onChange={(e) => setFormData({ ...formData, status: e.target.value })}
               required
            >
               <option value="PRESENT">Present</option>
               <option value="ABSENT">Absent</option>
               <option value="LATE">Late</option>
               <option value="HALF_DAY">Half Day</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Note (Optional)</label>
            <Input
              placeholder="Reason for manual entry or status"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Record"}</Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Settings Modal */}
      <Modal open={isSettingsOpen} onClose={() => !savingSettings && setIsSettingsOpen(false)} title="Attendance Configuration">
        <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
          <div className="space-y-2">
             <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 leading-relaxed mb-4">
               Define the default behavior for manual attendance requests. These times will be used when you mark an employee as PRESENT or when assessing late marks.
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Office In Time</label>
              <Input
                type="time"
                value={settings.defaultInTime}
                onChange={(e) => setSettings({ ...settings, defaultInTime: e.target.value })}
                required
              />
              <p className="text-[10px] text-slate-500">Standard start of shift</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Office Out Time</label>
              <Input
                type="time"
                value={settings.defaultOutTime}
                onChange={(e) => setSettings({ ...settings, defaultOutTime: e.target.value })}
                required
              />
              <p className="text-[10px] text-slate-500">Standard end of shift</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-bold text-slate-700">Required Working Hours (Daily)</label>
            <Input
              type="text"
              placeholder="e.g., 08:00 or 09:30"
              pattern="^[0-9]{1,2}:[0-9]{2}$"
              title="Enter hours and minutes in HH:MM format"
              value={settings.avgRequestTime}
              onChange={(e) => setSettings({ ...settings, avgRequestTime: e.target.value })}
              required
            />
            <p className="text-[10px] text-slate-500">The total number of hours an employee is required to work per day (e.g., 08:00 or 09:30). This is displayed in their self-service portal.</p>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)} disabled={savingSettings}>Cancel</Button>
            <Button type="submit" disabled={savingSettings}>{savingSettings ? "Applying..." : "Apply Defaults"}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
