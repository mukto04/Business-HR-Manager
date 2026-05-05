import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mongodb+srv://muktoarifin_db_user:oJGxEnlKp9mkojih@appdevsuk.wcnriaz.mongodb.net/app_devs_db?appName=AppdevsUK"
    }
  }
});

async function run() {
  const emp = await prisma.employee.findFirst({
    where: { name: { contains: 'Mukto', mode: 'insensitive' } }
  });
  
  if (!emp) {
    console.log("Employee not found");
    return;
  }
  
  console.log("Employee ID:", emp.id);
  
  const balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_year: { employeeId: emp.id, year: 2026 } }
  });
  
  console.log("Current Balance:", JSON.stringify(balance));
  
  const history = await prisma.leaveRecord.findMany({
    where: { 
      employeeId: emp.id, 
      category: "AUTOMATIC", 
      type: "DEDUCTION",
      year: 2026
    }
  });
  
  console.log("History Count:", history.length);
  console.log("History Records:", JSON.stringify(history));
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
