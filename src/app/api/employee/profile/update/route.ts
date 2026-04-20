import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function POST(request: NextRequest) {
  const session = await getEmployeeSession();
  const employeeId = session?.employeeId as string;
  
  if (!employeeId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ message: "Image data is required" }, { status: 400 });
    }

    const prisma = await getTenantPrisma();
    
    await prisma.employee.update({
      where: { id: employeeId },
      data: { image }
    });

    return NextResponse.json({ message: "Profile picture updated successfully!" });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
