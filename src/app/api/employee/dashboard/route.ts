import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { getEmployeeIdFromSession } from "@/lib/employee-auth";

export async function GET() {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const employee = await (await getTenantPrisma()).employee.findUnique({
      where: { id: employeeId },
      include: {
        leaveBalances: {
          where: { year: new Date().getFullYear() }
        },
        loans: {
          where: { dueAmount: { gt: 0 } }
        },
        advances: {
          where: { month: new Date().getMonth() + 1, year: new Date().getFullYear(), isDeducted: false }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // Get attendance stats for current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const attendances = await (await getTenantPrisma()).attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const presentDays = attendances.filter(a => a.status === "PRESENT").length;
    const absentDays = attendances.filter(a => a.status === "ABSENT").length;
    const lateDays = attendances.filter(a => a.status === "LATE").length;

    // Get upcoming holidays
    const holidays = await (await getTenantPrisma()).holiday.findMany({
      where: {
        date: { gte: new Date() }
      },
      orderBy: { date: "asc" },
      take: 3
    });

    return NextResponse.json({
      employee,
      stats: {
        presentDays,
        absentDays,
        lateDays
      },
      upcomingHolidays: holidays
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
