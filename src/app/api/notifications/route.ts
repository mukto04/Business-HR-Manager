import { NextResponse } from "next/server";
import { getTenantPrisma, masterPrisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";

export const dynamic = "force-dynamic";

export async function GET() {
  const notifications: Array<{ id: string; type: string; title: string; subtitle: string; date: string }> = [];
  
  try {
    const prisma = await getTenantPrisma();
    if (!prisma) throw new Error("Could not resolve Prisma Client");

    // 1. Get Tenant Details from Session/MasterDB for Subscription & Access Info
    const cookieStore = await cookies();
    const token = cookieStore.get("hr_session")?.value || cookieStore.get("employee_session")?.value;
    let subscriptionInfo = null;

    if (token) {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");
      const { payload } = await jose.jwtVerify(token, secret);
      const companyCode = payload.companyCode as string;

      if (companyCode) {
        const tenant = await masterPrisma.tenant.findUnique({ where: { companyCode } });
        if (tenant) {
          const daysLeft = tenant.subscriptionEnd 
            ? Math.ceil((new Date(tenant.subscriptionEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          
          subscriptionInfo = {
            daysLeft: Math.max(0, daysLeft),
            endDate: tenant.subscriptionEnd,
            adminUsername: tenant.adminUsername,
            adminPassword: tenant.adminPassword
          };

          // Add notification if expiry is near (<= 7 days)
          if (daysLeft > 0 && daysLeft <= 7) {
            notifications.unshift({
              id: "subscription-expiry-warning",
              type: "SUBSCRIPTION",
              title: "Subscription Expiring Soon!",
              subtitle: `Your service will expire in ${daysLeft} day(s). Please renew.`,
              date: new Date().toISOString()
            });
          } else if (daysLeft <= 0) {
             notifications.unshift({
              id: "subscription-expired",
              type: "SUBSCRIPTION",
              title: "Subscription Expired",
              subtitle: "Your service has been limited. Please contact super admin.",
              date: new Date().toISOString()
            });
          }
        }
      }
    }

    // 2. Fetch Module Data in parallel
    const [employees, pendingRequests] = await Promise.all([
      prisma.employee.findMany({ where: { status: "ACTIVE" } }).catch(() => []),
      prisma.attendanceRequest.findMany({
        where: { status: "PENDING" },
        include: { employee: true }
      }).catch(() => [])
    ]);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isSameDayMonth = (d1: Date, d2: Date) => {
      return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
    };

    // 3. Birthday & Anniversary Logic
    employees.forEach((emp) => {
      const dob = new Date(emp.dateOfBirth);
      const joinData = new Date(emp.joiningDate);

      if (isSameDayMonth(dob, today)) {
        notifications.push({
          id: `bd-today-${emp.id}`,
          type: "BIRTHDAY",
          title: `${emp.name}'s Birthday Today!`,
          subtitle: "Wish them a happy birthday! 🎉",
          date: today.toISOString()
        });
      }

      if (isSameDayMonth(joinData, today)) {
        const years = today.getFullYear() - joinData.getFullYear();
        if (years > 0) {
          notifications.push({
            id: `annv-today-${emp.id}`,
            type: "ANNIVERSARY",
            title: `${emp.name}'s Work Anniversary!`,
            subtitle: `Celebrating ${years} year(s) with us! 🎊`,
            date: today.toISOString()
          });
        }
      }
    });

    // 4. Attendance Request Logic
    for (const req of pendingRequests) {
      const empName = req.employee?.name || "Unknown Employee";
      notifications.unshift({
        id: `att-req-${req.id}`,
        type: "ATTENDANCE_REQUEST",
        title: `Attendance Request: ${empName}`,
        subtitle: `Reason: ${req.reason}`,
        date: req.createdAt ? req.createdAt.toISOString() : new Date().toISOString()
      });
    }

    return NextResponse.json({
      notifications,
      subscription: subscriptionInfo
    });
  } catch (error: any) {
    console.error("Notification API Error:", error.message);
    return NextResponse.json({ notifications: [], subscription: null });
  }
}
