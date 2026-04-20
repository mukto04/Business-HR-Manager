import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import * as jose from "jose";

const globalForPrisma = globalThis as unknown as {
  masterPrisma: PrismaClient | undefined;
  tenantClients: Map<string, PrismaClient>;
};

// 1. Central Master Prisma Client (Uses DATABASE_URL from .env)
export const masterPrisma =
  globalForPrisma.masterPrisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.masterPrisma = masterPrisma;
}

// 2. Cache for Tenant Prisma Clients
if (!globalForPrisma.tenantClients) {
  globalForPrisma.tenantClients = new Map();
}

export async function getTenantSlug() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hr_auth_token")?.value || cookieStore.get("employee_session")?.value;

  if (!token) {
    throw new Error("No active session.");
  }

  const secretStr = process.env.SESSION_SECRET || "appdevs-hr-portal-secure-vault-998877";
  const secret = new TextEncoder().encode(secretStr);
  const { payload } = await jose.jwtVerify(token, secret);
  
  return (payload.slug || payload.companyCode) as string;
}

/**
 * Dynamically returns a PrismaClient for the specific tenant.
 * It reads the database URL from the user's secure session cookie.
 */
export async function getTenantPrisma() {
  try {
    const slug = await getTenantSlug();

    if (!slug) {
      throw new Error("Tenant identifier (slug) not found in session.");
    }

    // --- Dynamic Routing: Always fetch fresh DB URL from Master DB ---
    const tenantRecord = await masterPrisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() }
    });

    if (!tenantRecord) {
      throw new Error(`Tenant company "${slug}" not found in master records.`);
    }

    const dbUrl = tenantRecord.dbUrl;

    if (!dbUrl) {
      throw new Error(`Database URL missing for company: ${slug}`);
    }

    // Extract DB name for logging (professional troubleshooting)
    const dbNameMatch = dbUrl.match(/\.net\/([^?]+)/);
    const dbName = dbNameMatch ? dbNameMatch[1] : "UNKNOWN";

    console.log(`[getTenantPrisma] Routing: ${slug} -> DB: ${dbName}`);

    // --- Subscription & Account Status Check ---
    const isStatusFrozen = tenantRecord.status === "FROZEN";
    const isExpired = tenantRecord.subscriptionEnd && new Date(tenantRecord.subscriptionEnd) < new Date();

    if (isStatusFrozen || isExpired) {
      throw new Error("ACCOUNT_FROZEN: Your subscription has expired or this account has been frozen by the administrator.");
    }

    // In production (Vercel), avoid global caching of PrismaClient instances
    if (process.env.NODE_ENV === "production") {
      const client = new PrismaClient({
        datasources: { db: { url: dbUrl } },
        log: ["error"],
      });
      
      // Temporary Diagnostic: Try to list some data or log connection success
      console.log(`[Prisma Diagnostic] Successfully initialized client for ${dbName}`);
      
      return client;
    }

    // In development, use cached client
    if (globalForPrisma.tenantClients.has(dbUrl)) {
      return globalForPrisma.tenantClients.get(dbUrl)!;
    }

    const client = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ["error"],
    });

    globalForPrisma.tenantClients.set(dbUrl, client);
    return client;
  } catch (error: any) {
    console.error("Prisma Multi-Tenant Routing Error:", error.message);
    if (error.message && error.message.includes("ACCOUNT_FROZEN")) {
      throw error;
    }
    throw new Error(`Failed to resolve dynamic database connection: ${error.message}`);
  }
}

/**
 * Public helper to get a PrismaClient for a tenant based on slug.
 * Useful for public routes (login branding, public avatars) where no session exists yet.
 */
export async function getPrismaBySlug(slug: string) {
  const tenantRecord = await masterPrisma.tenant.findUnique({
    where: { slug: slug.toLowerCase() }
  });

  if (!tenantRecord || tenantRecord.status === "FROZEN") {
    throw new Error("Tenant not found or account frozen");
  }

  const dbUrl = tenantRecord.dbUrl;
  
  if (process.env.NODE_ENV === "production") {
    return new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ["error"],
    });
  }

  if (globalForPrisma.tenantClients.has(dbUrl)) {
    return globalForPrisma.tenantClients.get(dbUrl)!;
  }

  const client = new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: ["error"],
  });

  globalForPrisma.tenantClients.set(dbUrl, client);
  return client;
}

// Keep the global prisma exported (but deprecated) to avoid immediate breakages
export const prisma = masterPrisma;
