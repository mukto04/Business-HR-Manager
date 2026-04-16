import { PrismaClient } from "@prisma/client";

const masterPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "mongodb+srv://muktoarifin_db_user:U0TKLqUkki2CKcjp@busniess-hr.wng4kqz.mongodb.net/saas_master?appName=busniess-hr"
    }
  }
});

async function main() {
  console.log("Checking Master Database Tenants...");
  const tenants = await masterPrisma.tenant.findMany();
  console.log("Found Tenants:", JSON.stringify(tenants, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await masterPrisma.$disconnect());
