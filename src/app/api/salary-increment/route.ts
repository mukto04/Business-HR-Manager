import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { calculateSalaryBreakdown } from "@/utils/calculations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE"; // ACTIVE or DEACTIVE

    const prisma = await getTenantPrisma();
    const employees = await prisma.employee.findMany({
      where: { status },
      include: {
        salaryStructure: true,
        increments: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to fetch increments", error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = await getTenantPrisma();
    const data = await request.json();
    const { employeeIds, type, value, month, year, note } = data;

    if (!employeeIds || employeeIds.length === 0) {
      return NextResponse.json({ message: "No employees selected" }, { status: 400 });
    }

    const targetIds = Array.isArray(employeeIds) ? employeeIds : [];
    
    const settings = await prisma.tenantSettings.findFirst();

    const result = await prisma.$transaction(async (tx) => {
      const employees = await tx.employee.findMany({
        where: { id: { in: targetIds } },
        include: { salaryStructure: true }
      });

      const processed = [];

      for (const employee of employees) {
        if (!employee.salaryStructure) continue;

        const oldSalary = employee.salaryStructure.totalSalary;
        const basicSalary = employee.salaryStructure.basicSalary;
        let incrementAmount = 0;
        let percentage = null;

        if (type === "FIXED_AMOUNT") {
          incrementAmount = Number(value);
        } else if (type === "PERCENT_TOTAL") {
          percentage = Number(value);
          incrementAmount = (oldSalary * percentage) / 100;
        } else if (type === "PERCENT_BASIC") {
          percentage = Number(value);
          incrementAmount = (basicSalary * percentage) / 100;
        }

        const newSalary = oldSalary + incrementAmount;

        // 1. Update SalaryStructure
        const breakdown = calculateSalaryBreakdown(newSalary, settings?.salaryStructure as any[] | undefined);
        
        await tx.salaryStructure.update({
          where: { employeeId: employee.id },
          data: {
            totalSalary: newSalary,
            basicSalary: breakdown.basicSalary,
            hra: breakdown.hra,
            medicalAllowance: breakdown.medicalAllowance,
            travelAllowance: breakdown.travelAllowance,
            others: breakdown.others,
            festivalBonus: breakdown.festivalBonus || 0,
            breakdown: breakdown.breakdown
          } as any
        });

        // 2. Create Increment Record
        await tx.salaryIncrement.create({
          data: {
            employeeId: employee.id,
            amount: incrementAmount,
            percentage,
            type,
            oldSalary,
            newSalary,
            effectiveMonth: Number(month),
            effectiveYear: Number(year),
            note
          }
        });

        // 3. Update current month salary if applicable
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();

        if (Number(month) === curMonth && Number(year) === curYear) {
            const { festivalBonus, ...monthlyBreakdown } = breakdown;
            await tx.monthlySalary.updateMany({
                where: {
                    employeeId: employee.id,
                    month: curMonth,
                    year: curYear,
                    isPaid: false // Only update if not yet paid
                },
                data: {
                    totalSalary: newSalary,
                    ...monthlyBreakdown,
                    workingDaySalary: newSalary, // Adjust base working day salary
                    payableSalary: { increment: incrementAmount } // Simple increment on payable
                } as any
            });
        }

        processed.push(employee.id);
      }

      return processed;
    });

    return NextResponse.json({ message: `Successfully applied increment to ${result.length} employees`, count: result.length });
  } catch (error: any) {
    console.error("Increment Error:", error);
    return NextResponse.json({ message: "Failed to apply increment", error: error.message }, { status: 500 });
  }
}
