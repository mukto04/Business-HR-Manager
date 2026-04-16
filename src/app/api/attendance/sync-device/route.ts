import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { getZKService } from "@/lib/zk-service";
import { format } from "date-fns";

export async function POST() {
  let zkService;
  try {
    zkService = getZKService();
    await zkService.connect();
    const logs = await zkService.getAttendanceLogs();
    console.log(`Sync: Successfully connected. Total logs on device: ${logs.length}`);
    
    let syncCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // --- Group logs by employee and date ---
    const groupedLogs: Map<string, { earliest: Date; latest: Date; machineUserId: string }> = new Map();

    for (const log of logs) {
      const { deviceUserId, recordTime } = log;
      const normalizedId = deviceUserId?.toString().trim();
      if (!normalizedId) continue;

      const dateStr = format(recordTime, "yyyy-MM-dd");
      const key = `${normalizedId}_${dateStr}`;

      const existingGroup = groupedLogs.get(key);
      if (!existingGroup) {
        groupedLogs.set(key, { earliest: recordTime, latest: recordTime, machineUserId: normalizedId });
      } else {
        if (recordTime < existingGroup.earliest) existingGroup.earliest = recordTime;
        if (recordTime > existingGroup.latest) existingGroup.latest = recordTime;
      }
    }

    console.log(`Sync: Grouped ${logs.length} logs into ${groupedLogs.size} unique sessions.`);

    // --- Process each group ---
    for (const [key, data] of groupedLogs.entries()) {
      try {
        const { machineUserId, earliest, latest } = data;

        // Find employee by fingerprintId
        const employee = await (await getTenantPrisma()).employee.findFirst({
          where: { fingerprintId: machineUserId },
        });

        if (!employee) {
          skipCount++;
          continue;
        }

        const dateObj = new Date(earliest);
        dateObj.setHours(0, 0, 0, 0);

        // Check if attendance already exists
        const existing = await (await getTenantPrisma()).attendance.findUnique({
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
          await (await getTenantPrisma()).attendance.create({
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
          
          // Re-calculate checkout validity including existing check-in
          const effectiveCheckIn = updateData.checkIn || existing.checkIn;
          const isCheckoutNewer = !existing.checkOut || latest > existing.checkOut;
          const isAfterThreshold = latest.getTime() - new Date(effectiveCheckIn).getTime() >= 5 * 60 * 1000;

          if (isCheckoutNewer && isAfterThreshold) {
            updateData.checkOut = latest;
          }

          if (Object.keys(updateData).length > 0) {
            await (await getTenantPrisma()).attendance.update({
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
      } catch (logError) {
        console.error(`Error processing group for ${key}:`, logError);
        errorCount++;
      }
    }

    await zkService.disconnect();

    return NextResponse.json({
      message: "Synchronization completed",
      summary: {
        totalLogs: logs.length,
        synced: syncCount,
        skipped: skipCount,
        errors: errorCount,
      }
    });

  } catch (error: any) {
    console.error("Fingerprint sync error:", error);
    if (zkService) await zkService.disconnect();
    return NextResponse.json(
      { message: "Sync failed", error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
