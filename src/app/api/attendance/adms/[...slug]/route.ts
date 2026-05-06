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

  console.log(`ADMS GET [${tenantSlug}]: ${path} | SN: ${sn}`);

  // Update device status if SN is provided
  if (sn) {
    try {
      const prisma = await getPrismaBySlug(tenantSlug);
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
    } catch (err) {
      console.error("ADMS GET Status Update Error:", err);
    }
  }

  // 1. Handshake / Initialization
  if (path === "iclock/cdata" || path === "") {
    return new NextResponse("OK", {
      headers: { "Content-Type": "text/plain" }
    });
  }

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

  try {
    const prisma = await getPrismaBySlug(tenantSlug);
    const body = await request.text();

    console.log(`ADMS POST [${tenantSlug}]: ${path} | Table: ${table} | SN: ${sn}`);

    if (table === "ATTLOG") {
      const lines = body.split("\n").filter(l => l.trim().length > 0);
      
      const settings = await prisma.tenantSettings.findFirst();
      const threshold = settings?.halfDayThreshold || 420;
      const lateThresholdTime = settings?.lateThresholdTime;
      const weeklySchedule = settings?.weeklySchedule as any[];
      const defaultInTime = settings?.defaultInTime;

      let processedCount = 0;
      for (const line of lines) {
        // Regex to split by any whitespace (tab or space)
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const employeeCodeRaw = parts[0];
        const dateStr = parts[1]; // yyyy-mm-dd
        const timeStr = parts[2]; // hh:mm:ss
        
        if (!dateStr || !timeStr) continue;

        // BDT Midnight (UTC+6) = 18:00 UTC previous day
        const dParts = dateStr.split("-");
        const dateOnly = new Date(Date.UTC(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]), -6, 0, 0, 0));
        
        // Actual Check-In time (full timestamp)
        const punchTime = new Date(`${dateStr}T${timeStr}`);
        if (isNaN(punchTime.getTime())) continue;

        // Find employee by employeeCode OR fingerprintId
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
              where: {
                employeeId_date: {
                  employeeId: employee.id,
                  date: dateOnly
                }
              }
            });

            let updateData: any = {};
            if (!existing) {
              updateData = {
                checkIn: punchTime,
                status: "PRESENT" 
              };
            } else {
              // Check-In is the earliest punch, Check-Out is the latest
              if (!existing.checkOut || punchTime > existing.checkOut) {
                updateData.checkOut = punchTime;
              }
              if (punchTime < (existing.checkIn || new Date())) {
                updateData.checkIn = punchTime;
              }
            }

            const finalCheckIn = updateData.checkIn || existing?.checkIn;
            const finalCheckOut = updateData.checkOut || existing?.checkOut;

            if (finalCheckIn) {
              updateData.status = calculateAttendanceStatus(
                finalCheckIn,
                finalCheckOut || null,
                threshold,
                lateThresholdTime,
                weeklySchedule,
                defaultInTime
              );
            }

            const record = await tx.attendance.upsert({
              where: {
                employeeId_date: {
                  employeeId: employee.id,
                  date: dateOnly
                }
              },
              update: updateData,
              create: {
                employeeId: employee.id,
                date: dateOnly,
                ...updateData
              }
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
    return new NextResponse("ERROR", { status: 500 });
  }
}
