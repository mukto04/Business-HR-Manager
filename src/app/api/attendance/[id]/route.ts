import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { checkIn, checkOut, status, isManual, note } = body;

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    const attendance = await (await getTenantPrisma()).attendance.update({
      where: { id },
      data: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status,
        isManual: isManual !== undefined ? isManual : true,
        note,
      },
    });

    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ message: error.message || "Failed to update attendance" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await (await getTenantPrisma()).attendance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Attendance record deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json({ message: error.message || "Failed to delete attendance" }, { status: 500 });
  }
}
