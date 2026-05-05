
import { PrismaClient } from "@prisma/client";

const masterPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "mongodb+srv://muktoarifin_db_user:U0TKLqUkki2CKcjp@busniess-hr.wng4kqz.mongodb.net/saas_master?appName=busniess-hr"
    }
  }
});

async function listTenants() {
  try {
    const tenants = await masterPrisma.tenant.findMany({
      select: {
        slug: true,
        companyName: true
      }
    });
    console.log("Tenants found:");
    console.log(JSON.stringify(tenants, null, 2));
  } catch (error) {
    console.error("Error fetching tenants:", error);
  } finally {
    await masterPrisma.$disconnect();
  }
}

listTenants();
