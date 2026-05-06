import { NextRequest, NextResponse } from "next/server";
import { getPrismaBySlug } from "@/lib/prisma";
import { calculateAttendanceStatus, syncLeaveBalanceForAttendance } from "@/lib/attendance-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const tenantSlug = slug[0];
  const path = slug.slice(1).join("/");
  
  const searchParams = request.nextUrl.searchParams;
  const sn = searchParams.get("SN");
  const fullUrl = request.nextUrl.pathname + request.nextUrl.search;

  try {
    const prisma = await getPrismaBySlug(tenantSlug);
    
    // DEBUG LOG
    await (prisma as any).admsLog.create({
      data: { sn, path: fullUrl, method: "GET" }
    });

    if (sn) {
      const device = await prisma.attendanceDevice.findUnique({
        where: { serialNumber: sn }
      });

      if (device) {
        await prisma.attendanceDevice.update({
          where: { id: device.id },
          data: { 
            lastSeen: new Date(),
            status: "ACTIVE",
            ipAddress: request.headers.get("x-forwarded-for") || (request as any).ip || "unknown"
          }
        });
      }
    }
  } catch (err) {
    console.error("ADMS GET Error:", err);
  }

  // respond with OK to everything
  return new NextResponse("OK", {
    headers: { "Content-Type": "text/plain" }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const tenantSlug = slug[0];
  const path = slug.slice(1).join("/");

  const searchParams = request.nextUrl.searchParams;
  const sn = searchParams.get("SN");
  const table = searchParams.get("table");
  const fullUrl = request.nextUrl.pathname + request.nextUrl.search;

  try {
    const prisma = await getPrismaBySlug(tenantSlug);
    const body = await request.text();

    // DEBUG LOG - Capture raw push data
    await (prisma as any).admsLog.create({
      data: { sn, table: table || "NONE", path: fullUrl, body: body.substring(0, 1000), method: "POST" }
    });

    // Handle Registration (if body contains DeviceType and table is NONE)
    if (body.includes("DeviceType=") && (!table || table === "NONE")) {
        console.log(`ADMS [${tenantSlug}] Registration from ${sn}`);
        return new NextResponse("OK", { 
            headers: { "Content-Type": "text/plain" } 
        });
    }

    // Handle ATTLOG (Attendance) or EVENT (Access Control)
    const isAttendance = table === "ATTLOG" || table === "EVENT" || body.includes("ATTLOG") || body.includes("EVENT");
    
    if (isAttendance) {
      const lines = body.split("\n").filter(l => l.trim().length > 0);
      
      const settings = await prisma.tenantSettings.findFirst();
      const threshold = settings?.halfDayThreshold || 420;
      const lateThresholdTime = settings?.lateThresholdTime;
      const weeklySchedule = settings?.weeklySchedule as any[];
      const defaultInTime = settings?.defaultInTime;

      let processedCount = 0;
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const employeeCodeRaw = parts[0];
        let dateStr = parts[1]; 
        let timeStr = parts[2];

        // Flexible date finding
        if (!dateStr || !dateStr.includes("-")) {
            const potentialDate = parts.find(p => p.includes("-") && p.split("-").length === 3);
            if (potentialDate) {
                const idx = parts.indexOf(potentialDate);
                dateStr = potentialDate;
                timeStr = parts[idx + 1];
            }
        }
        
        if (!dateStr || !timeStr) continue;

        const dParts = dateStr.split("-");
        const dateOnly = new Date(Date.UTC(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]), -6, 0, 0, 0));
        
        const punchTime = new Date(`${dateStr}T${timeStr}`);
        if (isNaN(punchTime.getTime())) continue;

        const numericId = parseInt(employeeCodeRaw).toString();
        const employee = await prisma.employee.findFirst({
          where: {
            OR: [
              { employeeCode: employeeCodeRaw },
              { employeeCode: numericId },
              { fingerprintId: employeeCodeRaw },
              { fingerprintId: numericId }
            ]
          }
        });

        if (employee) {
          await prisma.$transaction(async (tx) => {
            const existing = await tx.attendance.findUnique({
              where: { employeeId_date: { employeeId: employee.id, date: dateOnly } }
            });

            let updateData: any = {};
            if (!existing) {
              updateData = { checkIn: punchTime, status: "PRESENT" };
            } else {
              if (!existing.checkOut || punchTime > existing.checkOut) updateData.checkOut = punchTime;
              if (punchTime < (existing.checkIn || new Date())) updateData.checkIn = punchTime;
            }

            const finalCheckIn = updateData.checkIn || existing?.checkIn;
            const finalCheckOut = updateData.checkOut || existing?.checkOut;

            if (finalCheckIn) {
              updateData.status = calculateAttendanceStatus(
                finalCheckIn, finalCheckOut || null, threshold, lateThresholdTime, weeklySchedule, defaultInTime
              );
            }

            const record = await tx.attendance.upsert({
              where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
              update: updateData,
              create: { employeeId: employee.id, date: dateOnly, ...updateData }
            });

            await syncLeaveBalanceForAttendance(tx, employee.id, existing?.status, record.status, dateOnly);
          });
          processedCount++;
        }
      }
      console.log(`ADMS [${tenantSlug}] Processed ${processedCount} logs.`);
      return new NextResponse("OK", { headers: { "Content-Type": "text/plain" } });
    }

    return new NextResponse("OK", { headers: { "Content-Type": "text/plain" } });
  } catch (error: any) {
    console.error("ADMS POST Error:", error);
    return new NextResponse("OK", { headers: { "Content-Type": "text/plain" } }); 
  }
}
