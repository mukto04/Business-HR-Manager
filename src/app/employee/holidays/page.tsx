"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { CalendarRange, MapPin } from "lucide-react";

export default function EmployeeHolidaysPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/holidays")
      .then(res => res.json())
      .then(data => {
        setHolidays(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Company Holidays</h1>
          <p className="text-slate-500">Official holiday calendar for {new Date().getFullYear()}</p>
        </div>
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <CalendarRange className="h-6 w-6" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
          </div>
        ) : holidays.length > 0 ? (
          <div className="relative border-l-2 border-indigo-100 ml-3 sm:ml-6 space-y-8 py-4">
            {holidays.map((holiday) => {
              const dateObj = new Date(holiday.date);
              const isPassed = isPast(dateObj) && !isToday(dateObj);
              const isCurrent = isToday(dateObj);
              
              return (
                <div key={holiday.id} className="relative pl-6 sm:pl-8">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[9px] top-4 h-4 w-4 rounded-full border-4 border-white shadow-sm ${
                    isCurrent ? 'bg-indigo-600 ring-2 ring-indigo-200' :
                    isPassed ? 'bg-slate-300' : 'bg-emerald-500'
                  }`} />
                  
                  <div className={`rounded-2xl p-5 border transition-all ${
                    isCurrent ? 'bg-indigo-50 border-indigo-200 shadow-sm' :
                    isPassed ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                          isCurrent ? 'bg-indigo-600 text-white' :
                          isPassed ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <span className="text-xs font-bold uppercase">{format(dateObj, "MMM")}</span>
                          <span className="text-xl font-bold leading-none">{format(dateObj, "dd")}</span>
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${isPassed ? 'text-slate-600' : 'text-slate-800'}`}>
                            {holiday.name}
                          </h3>
                          <p className="text-sm text-slate-500 flex items-center mt-1">
                            {format(dateObj, "EEEE")} · {holiday.totalDays} Day{holiday.totalDays > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isCurrent ? "bg-indigo-200 text-indigo-800" :
                          isPassed ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {isCurrent ? "Today" : isPassed ? "Past" : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No holidays scheduled for this year yet.
          </div>
        )}
      </div>
    </div>
  );
}
