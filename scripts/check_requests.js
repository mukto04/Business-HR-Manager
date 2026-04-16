const { PrismaClient } = require('@prisma/client');

const tenantUrl = 'mongodb+srv://muktoarifin_db_user:oJGxEnlKp9mkojih@appdevsuk.wcnriaz.mongodb.net/app_devs_db?appName=AppdevsUK';
const prisma = new PrismaClient({
  datasources: {
    db: { url: tenantUrl }
  }
});

async function main() {
  console.log('Checking Pending Attendance Requests...');
  try {
    const requests = await prisma.attendanceRequest.findMany({
      where: { status: 'PENDING' }
    });
    console.log('Success! Pending count:', requests.length);
    if (requests.length > 0) {
      console.log('Sample Request:', requests[0]);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
