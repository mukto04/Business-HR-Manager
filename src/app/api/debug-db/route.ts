import { NextResponse } from "next/server";
import { masterPrisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hr_auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Session not found. Please log in first." }, { status: 401 });
    }

    // 1. Resolve Slug
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "appdevs-hr-portal-secure-vault-998877");
    const { payload } = await jose.jwtVerify(token, secret);
    const slug = payload.slug as string;

    // 2. Resolve DB URL from Master
    const tenant = await masterPrisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Tenant not found." });

    const URI = tenant.dbUrl;
    
    // 3. Connect using standard MongoDB Driver for inspection
    const mongoClient = new MongoClient(URI);
    await mongoClient.connect();
    
    const admin = mongoClient.db().admin();
    const { databases } = await admin.listDatabases();
    
    const report: any[] = [];
    
    for (const dbInfo of databases) {
      const db = mongoClient.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      const stats: any = {
        database: dbInfo.name,
        collections: []
      };

      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        if (count > 0) {
            stats.collections.push({ name: coll.name, count });
        }
      }
      
      if (stats.collections.length > 0) {
        report.push(stats);
      }
    }

    await mongoClient.close();

    return NextResponse.json({
      status: "Cluster Scan Complete",
      connectedToSlug: slug,
      currentConfiguredUrl: URI.replace(/\/\/.*@/, "//****:****@"), // Mask credentials
      foundData: report,
      instruction: "Find the database with 'Employee' count > 0. Then put its name after '.net/' in Super Admin panel."
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
