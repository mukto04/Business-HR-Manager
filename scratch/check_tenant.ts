import { PrismaClient } from "@prisma/client";

const masterPrisma = new PrismaClient();

async function checkTenant() {
  try {
    const tenant = await masterPrisma.tenant.findUnique({
      where: { companyCode: "AD1" }
    });
    console.log("Tenant AD1:", tenant);
  } catch (error) {
    console.error("Error checking tenant:", error);
  } finally {
    await masterPrisma.$disconnect();
  }
}

checkTenant();
