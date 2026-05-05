const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    const res = await prisma.$runCommandRaw({
      delete: "Notification",
      deletes: [
        { q: { employeeId: null }, limit: 0 }
      ]
    });
    console.log("Delete result:", res);
  } catch (err) {
    console.error(err);
  } finally {
    prisma.$disconnect();
  }
}

clean();
