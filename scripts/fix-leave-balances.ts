import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mongodb+srv://muktoarifin_db_user:oJGxEnlKp9mkojih@appdevsuk.wcnriaz.mongodb.net/app_devs_db?appName=AppdevsUK"
    }
  }
});

async function run() {
  const employees = await prisma.employee.findMany({
    include: {
      leaveBalances: { where: { year: 2026 } },
      leaveRecords: { where: { year: 2026, type: "DEDUCTION" } }
    }
  });

  for (const emp of employees) {
    const balance = emp.leaveBalances[0];
    if (!balance) continue;

    const totalDeductions = emp.leaveRecords.reduce((acc, rec) => acc + rec.amount, 0);
    const expectedDueLeave = balance.totalLeave - totalDeductions;

    if (Math.abs(balance.dueLeave - expectedDueLeave) > 0.01) {
      console.log(`Fixing balance for ${emp.name}: ${balance.dueLeave} -> ${expectedDueLeave}`);
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { dueLeave: expectedDueLeave }
      });
    } else {
      console.log(`Balance for ${emp.name} is correct: ${balance.dueLeave}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
