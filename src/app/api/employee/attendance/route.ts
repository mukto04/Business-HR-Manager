import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { getEmployeeIdFromSession } from "@/lib/employee-auth";

export async function GET(request: NextRequest) {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  try {
    // Bangladesh Time (BDT) is UTC+6
    // 00:00 BDT = 18:00 UTC of previous day
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, -6, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 17, 59, 59, 999));

    const attendances = await (await getTenantPrisma()).attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const holidays = await (await getTenantPrisma()).holiday.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const attMap = new Map();
    attendances.forEach(a => {
      // Use Bangladesh time to extract the day as the data is synced in that timezone
      const day = parseInt(new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Asia/Dhaka' }).format(new Date(a.date)));
      attMap.set(day, a);
    });

    const holMap = new Map();
    holidays.forEach(h => {
      const day = parseInt(new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Asia/Dhaka' }).format(new Date(h.date)));
      holMap.set(day, h);
    });

    const records = [];
    let presentCount = 0;
    let absentCount = 0;
    let weekendCount = 0;
    let holidayCount = 0;
    
    let totalCheckInMins = 0;
    let totalCheckOutMins = 0;
    let totalWorkingMins = 0;
    let validPunchesForAvg = 0;
    let validWorkingDaysForAvg = 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      const currentD = new Date(year, month - 1, d);
      const isWeekend = currentD.getDay() === 0 || currentD.getDay() === 6; // Sunday or Saturday
      
      let status = "ABSENT";
      let checkIn = null;
      let checkOut = null;
      let note = "";

      const att = attMap.get(d);
      const hol = holMap.get(d);

      if (att) {
        status = att.status; // PRESENT, LATE, etc.
        checkIn = att.checkIn;
        checkOut = att.checkOut;
        note = att.note;
        
        const isPresentLike = ["PRESENT", "LATE", "HALF_DAY"].includes(status);
        
        if (isPresentLike) {
          const hasBothPunches = checkIn && checkOut;
          
          if (hasBothPunches) {
             presentCount++;
             const ci = new Date(checkIn);
             const co = new Date(checkOut);
             
             totalCheckInMins += ci.getHours() * 60 + ci.getMinutes();
             totalCheckOutMins += co.getHours() * 60 + co.getMinutes();
             validPunchesForAvg++;
             
             const diffMs = co.getTime() - ci.getTime();
             totalWorkingMins += Math.floor(diffMs / 60000);
             validWorkingDaysForAvg++;
          } else {
             // For summary, if they didn't check out, they still might be marked present by system but HR logic doesn't count them in average.
             // Actually, HR logic only counts them as present if they have BOTH punches.
             // "countsAsPresent = true; presentCount++;" happens ONLY when "hasBothPunches && isPresentLike"
             // Wait, let's look closely at HR logic.
          }
        }
      } else {
        if (isWeekend) {
          status = "WEEKEND";
          weekendCount++;
        } else if (hol) {
          status = "HOLIDAY";
          holidayCount++;
          note = hol.name;
        }
      }
      
      // If no att, we need to decide if Absent
      if (!att && status === "ABSENT") {
        if (currentD > today) {
          status = "UPCOMING";
        } else {
          status = "ABSENT";
          absentCount++;
        }
      } else if (att && !checkIn && !checkOut && ["PRESENT", "LATE", "HALF_DAY"].includes(status)) {
         // Some manual attendances might not have punches, matching HR logic, they aren't counted in avg.
         // In HR board: absentCount is days not weekend, not holiday, not (hasBothPunches && isPresentLike).
         // If a manual attendance existed without punches, HR board counts it as ABSENT because countsAsPresent=false.
         // Let's ensure absentCount matches HR exactly.
         // But for simplicity, we won't drastically mutate their status in UI to ABSENT if it says PRESENT, we just won't count it for averages.
      }

      records.push({
        id: att?.id || `virtual-${d}`,
        date: currentD.toISOString(),
        status,
        checkIn,
        checkOut,
        note
      });
    }

    // Recalculate exact absentCount as per HR logic to match perfectly
    absentCount = 0;
    records.forEach(rec => {
       const cd = new Date(rec.date);
       if (cd <= today) {
          const isWeekendOrHoliday = rec.status === "WEEKEND" || rec.status === "HOLIDAY";
          const countsAsPresent = ["PRESENT", "LATE", "HALF_DAY"].includes(rec.status) && !!rec.checkIn && !!rec.checkOut;
          if (!isWeekendOrHoliday && !countsAsPresent) {
             absentCount++;
          }
       }
    });

    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formatMins = (mins: number) => {
      if (mins === 0 || isNaN(mins)) return "-";
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const avgWorkingHoursDecimal = validWorkingDaysForAvg > 0 ? (totalWorkingMins / 60) / validWorkingDaysForAvg : 0;
    let avgWorkingHoursStr = "-";
    if (avgWorkingHoursDecimal > 0) {
      const hours = Math.floor(avgWorkingHoursDecimal);
      const minutes = Math.round((avgWorkingHoursDecimal - hours) * 60);
      avgWorkingHoursStr = `${hours}h ${minutes}m`;
    }

    const avgCheckIn = validPunchesForAvg > 0 ? formatMins(totalCheckInMins / validPunchesForAvg) : "-";
    const avgCheckOut = validPunchesForAvg > 0 ? formatMins(totalCheckOutMins / validPunchesForAvg) : "-";

    const settings = await (await getTenantPrisma()).tenantSettings.findFirst();
    let reqWorkingTimeStr = "09:00";
    if (settings && settings.avgRequestTime) {
      reqWorkingTimeStr = settings.avgRequestTime;
    }

    return NextResponse.json({
      summary: {
        totalDays: endOfMonth.getDate(),
        presentCount,
        absentCount,
        weekendCount,
        holidayCount,
        avgCheckIn,
        avgCheckOut,
        avgWorkingHours: avgWorkingHoursStr,
        reqWorkingTime: reqWorkingTimeStr
      },
      records
    });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
