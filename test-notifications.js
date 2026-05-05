const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const res = await prisma.$runCommandRaw({
      insert: "Notification",
      documents: [
        {
          employeeId: null,
          title: "Test HR Note",
          message: "Raw insert test",
          type: "SYSTEM",
          isRead: false,
          createdAt: { $date: new Date().toISOString() },
          updatedAt: { $date: new Date().toISOString() }
        }
      ]
    });
    console.log("Raw insert result:", res);

    const check = await prisma.notification.findMany({ take: 2, orderBy: { createdAt: 'desc'} });
    console.log("Notifications after insert:", check);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    prisma.$disconnect();
  }
}

test();
