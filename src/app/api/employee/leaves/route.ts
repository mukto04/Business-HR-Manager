import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { getEmployeeIdFromSession } from "@/lib/employee-auth";

export async function GET() {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const leaveBalances = await (await getTenantPrisma()).leaveBalance.findMany({
      where: { employeeId },
      orderBy: { year: "desc" }
    });

    return NextResponse.json(leaveBalances);
  } catch (error) {
    console.error("Leaves API error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
