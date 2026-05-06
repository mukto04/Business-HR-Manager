import { NextRequest, NextResponse } from "next/server";
import { getPrismaBySlug } from "@/lib/prisma";
import { parse } from "date-fns";

/**
 * ADMS Protocol Handler
 * This handles requests from ZKTeco devices in ADMS (Push) mode.
 * Expected URL: /api/attendance/adms/[slug]/iclock/cdata
 */

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

  // 1. Handshake / Initialization
  if (path === "iclock/cdata") {
    return new NextResponse("OK", {
      headers: { "Content-Type": "text/plain" }
    });
  }

  // 2. Command Polling
  if (path === "iclock/getrequest") {
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

  console.log(`ADMS POST [${tenantSlug}]: ${path} | SN: ${sn} | Table: ${table}`);

  if (path === "iclock/cdata") {
    if (table === "ATTLOG") {
      const body = await request.text();
      const lines = body.split("\n").filter(l => l.trim());
      
      console.log(`Processing ${lines.length} attendance logs for SN: ${sn}`);
      
      try {
        const prisma = await getPrismaBySlug(tenantSlug);
        
        // Find device and update last seen
        const device = await prisma.attendanceDevice.findUnique({
          where: { serialNumber: sn || "" }
        });

        if (device) {
          await prisma.attendanceDevice.update({
            where: { id: device.id },
            data: { 
              lastSeen: new Date(),
              lastSync: new Date(),
              status: "ACTIVE",
              ipAddress: request.headers.get("x-forwarded-for") || (request as any).ip || "unknown"
            }
          });
        }

        let processedCount = 0;
        for (const line of lines) {
          const parts = line.split("\t");
          if (parts.length < 2) continue;

          const employeeCode = parts[0];
          const timeStr = parts[1]; // Format: 2023-10-27 08:30:00
          
          const timestamp = new Date(timeStr);
          if (isNaN(timestamp.getTime())) continue;

          const dateOnly = new Date(timestamp);
          dateOnly.setHours(0, 0, 0, 0);

          // Find employee
          const employee = await prisma.employee.findUnique({
            where: { employeeCode }
          });

          if (employee) {
            // Upsert attendance record
            const existing = await prisma.attendance.findUnique({
              where: {
                employeeId_date: {
                  employeeId: employee.id,
                  date: dateOnly
                }
              }
            });

            if (!existing) {
              await prisma.attendance.create({
                data: {
                  employeeId: employee.id,
                  date: dateOnly,
                  checkIn: timestamp,
                  status: "PRESENT",
                  isManual: false,
                  note: `ADMS Sync (${sn})`
                }
              });
            } else {
              // Update checkIn/checkOut
              const data: any = {};
              if (!existing.checkIn || timestamp < new Date(existing.checkIn)) {
                data.checkIn = timestamp;
              }
              if (!existing.checkOut || timestamp > new Date(existing.checkOut || existing.checkIn || 0)) {
                data.checkOut = timestamp;
              }

              if (Object.keys(data).length > 0) {
                await prisma.attendance.update({
                  where: { id: existing.id },
                  data
                });
              }
            }
            processedCount++;
          }
        }

        return new NextResponse(`OK: ${processedCount}`, {
          headers: { "Content-Type": "text/plain" }
        });
      } catch (error) {
        console.error("ADMS Log Processing Error:", error);
        return new NextResponse("Error processing logs", { status: 500 });
      }
    }
  }

  return new NextResponse("OK", {
    headers: { "Content-Type": "text/plain" }
  });
}
