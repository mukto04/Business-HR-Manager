import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { monthlySalarySchema, toMonthlySalaryPayload } from "@/app/api/_helpers";
import { calculateSalaryBreakdown } from "@/utils/calculations";

export async function GET() {
  // Sync unpaid salaries with latest employee data (loans, advances, leaves, structures)
  const unpaidItems = await (await getTenantPrisma()).monthlySalary.findMany({
    where: { isPaid: false },
    include: { employee: { include: { leaveBalances: true, salaryStructure: true } } }
  });

  const employeeIds = unpaidItems.map(item => item.employeeId);
  const years = Array.from(new Set(unpaidItems.map(item => item.year)));
  const months = Array.from(new Set(unpaidItems.map(item => item.month)));

  // 2. Fetch all relevant advances and loans in bulk
  const allAdvances = await (await getTenantPrisma()).advanceSalary.findMany({
    where: {
      employeeId: { in: employeeIds },
      year: { in: years },
      month: { in: months },
      isDeducted: false
    }
  });

  const allLoans = await (await getTenantPrisma()).loan.findMany({
    where: {
      employeeId: { in: employeeIds },
      dueAmount: { gt: 0 }
    }
  });

  // 3. Process and sync
  for (const ms of unpaidItems) {
    const totalSalary = ms.employee?.salaryStructure?.totalSalary || 0;
    const leaveBalance = ms.employee?.leaveBalances?.find(lb => lb.year === ms.year);
    const dueLeave = leaveBalance?.dueLeave || 0;
    const workingDays = dueLeave < 0 ? 30 + dueLeave : 30;
    const workingDaySalary = (totalSalary / 30) * workingDays;

    // Filter advances for this specific employee and period
    const advances = allAdvances.filter(adv => 
      adv.employeeId === ms.employeeId && 
      adv.month === ms.month && 
      adv.year === ms.year
    );
    const advanceSalaryAmount = advances.reduce((sum, adv) => sum + adv.amount, 0);

    // Filter loans for this specific employee and period
    const loans = allLoans.filter(loan => {
      const isCorrectEmployee = loan.employeeId === ms.employeeId;
      const startedBeforeOrDuring = !loan.startYear || 
        loan.startYear < ms.year || 
        (loan.startYear === ms.year && (!loan.startMonth || loan.startMonth <= ms.month));
      return isCorrectEmployee && startedBeforeOrDuring;
    });
    const loanAdjustAmount = loans.reduce((sum, loan) => sum + Math.min(loan.installmentAmount, loan.dueAmount), 0);
    const leaveDeductionAmount = Math.max(0, totalSalary - workingDaySalary);

    const payableSalary = workingDaySalary - advanceSalaryAmount - loanAdjustAmount + (ms.festivalBonus || 0);

    if (
      ms.workingDays !== workingDays || 
      ms.workingDaySalary !== workingDaySalary || 
      ms.advanceSalaryAmount !== advanceSalaryAmount || 
      ms.loanAdjustAmount !== loanAdjustAmount ||
      ms.leaveDeductionAmount !== leaveDeductionAmount ||
      ms.payableSalary !== payableSalary ||
      ms.totalSalary !== totalSalary
    ) {
      const { festivalBonus, ...breakdown } = calculateSalaryBreakdown(totalSalary);

      await (await getTenantPrisma()).monthlySalary.update({
        where: { id: ms.id },
        data: {
          totalSalary,
          ...breakdown,
          workingDays,
          workingDaySalary,
          advanceSalaryAmount,
          loanAdjustAmount,
          leaveDeductionAmount,
          payableSalary,
          totalSalaryPaid: payableSalary,
        }
      });
    }
  }

  const items = await (await getTenantPrisma()).monthlySalary.findMany({
    include: { employee: true },
    orderBy: [
      { year: "desc" }, 
      { month: "desc" }, 
      { employee: { joiningDate: "asc" } }
    ]
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = monthlySalarySchema.parse(await request.json());

    const item = await (await getTenantPrisma()).monthlySalary.create({
      data: toMonthlySalaryPayload(parsed),
      include: { employee: true }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create monthly salary", error }, { status: 400 });
  }
}
