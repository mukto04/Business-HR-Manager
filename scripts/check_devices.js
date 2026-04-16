const { PrismaClient } = require('@prisma/client');

const tenantUrl = 'mongodb+srv://muktoarifin_db_user:oJGxEnlKp9mkojih@appdevsuk.wcnriaz.mongodb.net/app_devs_db?appName=AppdevsUK';
const prisma = new PrismaClient({
  datasources: {
    db: { url: tenantUrl }
  }
});

async function main() {
  console.log('Testing AttendanceDevice model...');
  try {
    const devices = await prisma.attendanceDevice.findMany();
    console.log('Success! Device count:', devices.length);
  } catch (e) {
    console.error('Error fetching devices:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
