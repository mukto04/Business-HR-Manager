import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { salarySchema, toSalaryPayload } from "@/app/api/_helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const showHistory = searchParams.get("history") === "true";

  const salaries = await (await getTenantPrisma()).salaryStructure.findMany({
    where: {
      employee: {
        status: showHistory ? "DISABLED" : "ACTIVE"
      }
    },
    include: { employee: true },
    orderBy: { 
      employee: {
        joiningDate: "asc"
      }
    }
  });

  return NextResponse.json(salaries);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = salarySchema.parse(await request.json());

    const existing = await (await getTenantPrisma()).salaryStructure.findFirst({
      where: { employeeId: parsed.employeeId }
    });

    if (existing) {
      return NextResponse.json({ message: "Salary structure already exists for this employee" }, { status: 400 });
    }

    const salary = await (await getTenantPrisma()).salaryStructure.create({
      data: toSalaryPayload(parsed),
      include: { employee: true }
    });

    return NextResponse.json(salary, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create salary structure", error }, { status: 400 });
  }
}
