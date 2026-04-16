import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ message: "API Key is required" }, { status: 401 });
    }

    const { logs } = await request.json();
    if (!Array.isArray(logs)) {
      return NextResponse.json({ message: "Logs must be an array" }, { status: 400 });
    }

    const prisma = await getTenantPrisma();

    // 1. Verify Device
    const device = await prisma.attendanceDevice.findUnique({
      where: { apiKey }
    });

    if (!device) {
      return NextResponse.json({ message: "Invalid API Key" }, { status: 401 });
    }

    console.log(`Sync Push: Received ${logs.length} logs from device ${device.deviceName}`);

    let syncCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 2. Group logs by employee and date (just like the pull sync does)
    const groupedLogs: Map<string, { earliest: Date; latest: Date; machineUserId: string }> = new Map();

    for (const log of logs) {
      const { deviceUserId, recordTime } = log;
      const normalizedId = deviceUserId?.toString().trim();
      if (!normalizedId) continue;

      const recordDate = new Date(recordTime);
      const dateStr = format(recordDate, "yyyy-MM-dd");
      const key = `${normalizedId}_${dateStr}`;

      const existingGroup = groupedLogs.get(key);
      if (!existingGroup) {
        groupedLogs.set(key, { earliest: recordDate, latest: recordDate, machineUserId: normalizedId });
      } else {
        if (recordDate < existingGroup.earliest) existingGroup.earliest = recordDate;
        if (recordDate > existingGroup.latest) existingGroup.latest = recordDate;
      }
    }

    // 3. Process grouped sessions
    for (const [key, data] of groupedLogs.entries()) {
      try {
        const { machineUserId, earliest, latest } = data;

        // Find employee by fingerprintId
        const employee = await prisma.employee.findFirst({
          where: { fingerprintId: machineUserId },
        });

        if (!employee) {
          skipCount++;
          continue;
        }

        const dateObj = new Date(earliest);
        dateObj.setHours(0, 0, 0, 0);

        // Check if attendance already exists
        const existing = await prisma.attendance.findUnique({
          where: {
            employeeId_date: {
              employeeId: employee.id,
              date: dateObj,
            },
          },
        });

        // Determine if we have a valid checkout (at least 5 minutes gap)
        const hasValidCheckout = latest.getTime() - earliest.getTime() >= 5 * 60 * 1000;

        if (!existing) {
          // No record for this day: Create it
          await prisma.attendance.create({
            data: {
              employeeId: employee.id,
              date: dateObj,
              checkIn: earliest,
              checkOut: hasValidCheckout ? latest : null,
              status: "PRESENT",
              isManual: false,
            },
          });
          syncCount++;
        } else {
          // Record exists: Update it with the absolute min/max
          let updateData: any = {};
          
          if (!existing.checkIn || earliest < existing.checkIn) {
            updateData.checkIn = earliest;
          }
          
          const effectiveCheckIn = updateData.checkIn || existing.checkIn;
          const isCheckoutNewer = !existing.checkOut || latest > existing.checkOut;
          const isAfterThreshold = latest.getTime() - new Date(effectiveCheckIn).getTime() >= 5 * 60 * 1000;

          if (isCheckoutNewer && isAfterThreshold) {
            updateData.checkOut = latest;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.attendance.update({
              where: { id: existing.id },
              data: {
                ...updateData,
                isManual: false,
              },
            });
            syncCount++;
          } else {
            skipCount++;
          }
        }
      } catch (e) {
        console.error(`Sync Push Error for ${key}:`, e);
        errorCount++;
      }
    }

    // 4. Update device "Last Seen" and "Status"
    await prisma.attendanceDevice.update({
      where: { id: device.id },
      data: {
        lastSync: syncCount > 0 ? new Date() : device.lastSync,
        lastSeen: new Date(),
        status: "ACTIVE"
      }
    });

    return NextResponse.json({
      message: "Push synchronization completed",
      summary: {
        received: logs.length,
        synced: syncCount,
        skipped: skipCount,
        errors: errorCount
      }
    });

  } catch (error: any) {
    console.error("Critical Sync Push error:", error);
    return NextResponse.json(
      { message: "Push sync failed", error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
