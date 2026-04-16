const { PrismaClient } = require('@prisma/client');

const tenantUrl = 'mongodb+srv://muktoarifin_db_user:oJGxEnlKp9mkojih@appdevsuk.wcnriaz.mongodb.net/app_devs_db?appName=AppdevsUK';
const prisma = new PrismaClient({
  datasources: {
    db: { url: tenantUrl }
  }
});

async function main() {
  const employees = await prisma.employee.findMany();
  console.log('Total Employees:', employees.length);
  console.log('Active Employees:', employees.filter(e => e.status === 'ACTIVE').length);
  
  const balances = await prisma.leaveBalance.findMany({
    where: { year: 2026 },
  });

  console.log('Leave Balances for 2026:', balances.length);
  
  if (balances.length > 0) {
      console.log('Example Balance:', balances[0]);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
