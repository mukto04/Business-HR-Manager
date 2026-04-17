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

/**
 * Dynamically returns a PrismaClient for the specific tenant.
 * It reads the database URL from the user's secure session cookie.
 */
export async function getTenantPrisma() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hr_auth_token")?.value || cookieStore.get("employee_session")?.value;

  if (!token) {
    throw new Error("No active session. Database connection unavailable.");
  }

  try {
    const secretStr = process.env.SESSION_SECRET || "appdevs-hr-portal-secure-vault-998877";
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jose.jwtVerify(token, secret);
    
    const dbUrl = payload.dbUrl as string;
    const slug = (payload.slug || payload.companyCode) as string;

    if (!dbUrl) {
      throw new Error("Tenant Database URL not found in session.");
    }

    // --- Subscription Enforcement Check ---
    // We check the master database to see if this tenant is still active
    const tenantRecord = await masterPrisma.tenant.findUnique({
      where: slug ? { slug } : { slug: "UNKNOWN" } // Support both legacy companyCode and new slug in JWT during transition
    });

    if (tenantRecord) {
      const isStatusFrozen = tenantRecord.status === "FROZEN";
      const isExpired = tenantRecord.subscriptionEnd && new Date(tenantRecord.subscriptionEnd) < new Date();

      if (isStatusFrozen || isExpired) {
        throw new Error("ACCOUNT_FROZEN: Your subscription has expired or this account has been frozen by the administrator.");
      }
    }

    // Return cached client if exists
    if (globalForPrisma.tenantClients.has(dbUrl)) {
      return globalForPrisma.tenantClients.get(dbUrl)!;
    }
    // ...

    // Otherwise create a new client and cache it
    const client = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: ["error"],
    });

    globalForPrisma.tenantClients.set(dbUrl, client);
    return client;
  } catch (error: any) {
    console.error("Prisma Multi-Tenant Routing Error:", error);
    if (error.message && error.message.includes("ACCOUNT_FROZEN")) {
      throw error; // Rethrow frozen status directly
    }
    throw new Error("Failed to resolve dynamic database connection.");
  }
}

// Keep the global prisma exported (but deprecated) to avoid immediate breakages
export const prisma = masterPrisma;
