const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants in system:', tenants.map(t => ({ code: t.companyCode, name: t.companyName, url: t.dbUrl })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
