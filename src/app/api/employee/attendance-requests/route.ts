import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { getEmployeeIdFromSession } from "@/lib/employee-auth";

export async function GET(request: NextRequest) {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await (await getTenantPrisma()).attendanceRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { date, checkIn, checkOut, reason } = await request.json();

    if (!date || !reason) {
      return NextResponse.json({ message: "Date and Reason are required" }, { status: 400 });
    }

    const newRequest = await (await getTenantPrisma()).attendanceRequest.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Submit request error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
