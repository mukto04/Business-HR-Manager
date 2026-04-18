import { NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Pre-resolve Prisma client once to avoid parallel session lookups
    const prisma = await getTenantPrisma();

    const [employees, holidays, monthlySalaries, loans, officeCosts] = await Promise.all([
      prisma.employee.findMany({ 
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" } 
      }),
      prisma.holiday.findMany(),
      prisma.monthlySalary.findMany({
        where: { month: currentMonth, year: currentYear }
      }),
      prisma.loan.findMany({
        where: { dueAmount: { gt: 0 } }
      }),
      prisma.officeCost.findMany({
        where: { month: currentMonth, year: currentYear }
      })
    ]);

    console.log(`[Dashboard Debug] Found ${employees.length} employees in tenant DB.`);

    const birthdays = employees.filter((employee) => new Date(employee.dateOfBirth).getMonth() === now.getMonth());
    const anniversaries = employees.filter((employee) => new Date(employee.joiningDate).getMonth() === now.getMonth());
    const holidaysThisMonth = holidays.filter((holiday) => new Date(holiday.date).getMonth() === now.getMonth()).length;
    
    // Total running month payable salary
    const salaryExpenseSummary = monthlySalaries.reduce((sum, item) => sum + item.payableSalary, 0);
    
    // Pending loans where due amount > 0
    const pendingLoans = loans.reduce((sum, item) => sum + item.dueAmount, 0);

    // Office cost for current month
    const currentMonthOfficeCost = officeCosts.reduce((sum, item) => {
      return sum + item.bazarCost + item.extraCost + item.recurringCost + item.capitalCost;
    }, 0);

    return NextResponse.json({
      totalEmployees: employees.length,
      birthdaysThisMonth: birthdays.length,
      anniversariesThisMonth: anniversaries.length,
      holidaysThisMonth,
      salaryExpenseSummary,
      pendingLeaves: 0,
      pendingLoans,
      currentMonthOfficeCost,
      birthdayEmployees: birthdays.map((item) => ({ id: item.id, name: item.name, date: item.dateOfBirth })),
      anniversaryEmployees: anniversaries.map((item) => ({ id: item.id, name: item.name, date: item.joiningDate })),
      expenseChart: [
        { name: "Salary", amount: salaryExpenseSummary },
        { name: "Off. Cost", amount: currentMonthOfficeCost },
        { name: "Loans", amount: pendingLoans }
      ]
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error.message);
    if (error.message && error.message.includes("ACCOUNT_FROZEN")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: `Dashboard error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
