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
      salaryStructure: true,
      monthlySalaries: {
        where: { month: 5, year: 2026 }
      }
    }
  });

  console.log("Employees Count:", employees.length);
  employees.forEach(emp => {
    console.log(`- ${emp.name}:`);
    console.log(`  Has Salary Structure: ${!!emp.salaryStructure}`);
    console.log(`  Has May 2026 Record: ${emp.monthlySalaries.length > 0}`);
  });
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
