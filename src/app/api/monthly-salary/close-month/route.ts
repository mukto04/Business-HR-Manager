import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { calculateSalaryBreakdown } from "@/utils/calculations";

export async function POST(request: NextRequest) {
  try {
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ message: "month and year are required" }, { status: 400 });
    }

    // Calculate next month and year
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    await (await getTenantPrisma()).$transaction(async (tx) => {
      // Get all monthly salary records for this month
      const monthlySalaries = await tx.monthlySalary.findMany({
        where: { month, year },
        include: {
          employee: {
            include: {
              salaryStructure: true,
              leaveBalances: true,
            }
          }
        }
      });

      for (const ms of monthlySalaries) {
        // IDEMPOTENCY GUARD: 
        // 5. Check if next month salary record already exists
        const nextMonthRecord = await tx.monthlySalary.findUnique({
          where: { employeeId_month_year: { employeeId: ms.employeeId, month: nextMonth, year: nextYear } }
        });

        // If next month record already exists, we skip processing this employee's current month
        // to avoid duplicate deductions or duplicate record creation.
        if (nextMonthRecord) continue;

        if (!ms.isHeld) {
          // 1. Mark as paid (force flag to true if it wasn't already)
          await tx.monthlySalary.update({
            where: { id: ms.id },
            data: { isPaid: true }
          });

          // 2. Deduct loan installments → update loan paid/due amounts
          if (ms.loanAdjustAmount > 0) {
            const loans = await tx.loan.findMany({
              where: { 
                employeeId: ms.employeeId, 
                dueAmount: { gt: 0 },
                OR: [
                  { startYear: null },
                  { startYear: { lt: year } },
                  { startYear: year, startMonth: { lte: month } },
                  { startYear: year, startMonth: null }
                ]
              }
            });

            for (const loan of loans) {
              const deduction = Math.min(loan.installmentAmount, loan.dueAmount);
              if (deduction > 0) {
                const newPaid = loan.paidAmount + deduction;
                const newDue = Math.max(0, loan.dueAmount - deduction);
                await tx.loan.update({
                  where: { id: loan.id },
                  data: {
                    paidAmount: newPaid,
                    dueAmount: newDue,
                    installmentAmount: newDue <= 0 ? 0 : loan.installmentAmount
                  }
                });
              }
            }
          }

          // 3. Mark advance salaries as deducted
          if (ms.advanceSalaryAmount > 0) {
            await tx.advanceSalary.updateMany({
              where: { employeeId: ms.employeeId, month, year, isDeducted: false },
              data: { isDeducted: true }
            });
          }
        }

        // 4. Reset negative leave balances back to 0 for this year
        const leaveBalance = ms.employee?.leaveBalances?.find(lb => lb.year === year);
        if (leaveBalance && leaveBalance.dueLeave < 0) {
          await tx.leaveBalance.update({
            where: { id: leaveBalance.id },
            data: { dueLeave: 0 }
          });
        }

        // 5. Create next month salary record
        if (ms.employee?.salaryStructure) {
          const totalSalary = ms.employee.salaryStructure.totalSalary;
          const { festivalBonus, ...breakdown } = calculateSalaryBreakdown(totalSalary);
          const workingDaySalary = (totalSalary / 30) * 30;

          // Check advance salary for next month
          const nextAdvances = await tx.advanceSalary.findMany({
            where: { employeeId: ms.employeeId, month: nextMonth, year: nextYear, isDeducted: false }
          });
          const nextAdvanceAmount = nextAdvances.reduce((s, a) => s + a.amount, 0);

          // Check loan installments for next month
          const activeLoans = await tx.loan.findMany({
            where: { 
              employeeId: ms.employeeId, 
              dueAmount: { gt: 0 },
              OR: [
                { startYear: null },
                { startYear: { lt: nextYear } },
                { startYear: nextYear, startMonth: { lte: nextMonth } },
                { startYear: nextYear, startMonth: null }
              ]
            }
          });
          const nextLoanAdjust = activeLoans.reduce((s, l) => s + Math.min(l.installmentAmount, l.dueAmount), 0);

          const payableSalary = workingDaySalary - nextAdvanceAmount - nextLoanAdjust;

          await tx.monthlySalary.create({
            data: {
              employeeId: ms.employeeId,
              month: nextMonth,
              year: nextYear,
              totalSalary,
              ...breakdown,
              festivalBonus: ms.employee.salaryStructure.festivalBonus || 0,
              workingDays: 30,
              workingDaySalary,
              advanceSalaryAmount: nextAdvanceAmount,
              loanAdjustAmount: nextLoanAdjust,
              payableSalary,
              totalSalaryPaid: payableSalary,
              isPaid: false
            }
          });
        }
      }
    });

    const monthNames: Record<number, string> = {
      1: "January", 2: "February", 3: "March", 4: "April",
      5: "May", 6: "June", 7: "July", 8: "August",
      9: "September", 10: "October", 11: "November", 12: "December"
    };

    return NextResponse.json({
      message: `${monthNames[month]} ${year} has been closed successfully. ${monthNames[nextMonth]} ${nextYear} salary records have been generated.`
    });
  } catch (error) {
    console.error("Close Month Error:", error);
    return NextResponse.json({ message: "Failed to close month", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
