import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, hrNote } = body; // status: APPROVED or REJECTED

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const attendanceRequest = await (await getTenantPrisma()).attendanceRequest.findUnique({
      where: { id },
    });

    if (!attendanceRequest) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const updatedRequest = await (await getTenantPrisma()).attendanceRequest.update({
      where: { id },
      data: { status, hrNote },
    });

    if (status === "APPROVED") {
      // Fetch tenant settings to get the HR configured average request time bounding
      const settings = await (await getTenantPrisma()).tenantSettings.findFirst();
      
      let checkInDate = attendanceRequest.checkIn;
      let checkOutDate = attendanceRequest.checkOut;

      if (settings && attendanceRequest.date) {
        // Enforce the HR default bounds rather than employee submitted if configured
        const reqDate = new Date(attendanceRequest.date);
        
        const inParts = settings.avgRequestTime.split(":");
        if (inParts.length === 2) {
           checkInDate = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate(), parseInt(inParts[0]), parseInt(inParts[1]), 0);
        }

        const outParts = settings.defaultOutTime.split(":");
        if (outParts.length === 2) {
           checkOutDate = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate(), parseInt(outParts[0]), parseInt(outParts[1]), 0);
        }
      }

      // Upsert into Attendance table
      await (await getTenantPrisma()).attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: attendanceRequest.employeeId,
            date: attendanceRequest.date,
          }
        },
        update: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: "PRESENT",
          isManual: true,
          note: attendanceRequest.reason,
        },
        create: {
          employeeId: attendanceRequest.employeeId,
          date: attendanceRequest.date,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: "PRESENT",
          isManual: true,
          note: attendanceRequest.reason,
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error("Error updating attendance request:", error);
    return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
  }
}
