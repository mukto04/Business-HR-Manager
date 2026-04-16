import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { monthlySalarySchema, toMonthlySalaryPayload } from "@/app/api/_helpers";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const parsed = monthlySalarySchema.parse(await request.json());

    const item = await (await getTenantPrisma()).monthlySalary.update({
      where: { id },
      data: toMonthlySalaryPayload(parsed),
      include: { employee: true }
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update monthly salary", error }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await (await getTenantPrisma()).monthlySalary.delete({ where: { id } });
    return NextResponse.json({ message: "Monthly salary deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete monthly salary", error }, { status: 400 });
  }
}
