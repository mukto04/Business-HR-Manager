import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function POST(request: NextRequest) {
  let prisma: PrismaClient | null = null;

  try {
    const { dbUrl } = await request.json();

    if (!dbUrl || typeof dbUrl !== "string") {
      return NextResponse.json({ message: "Missing or invalid connection string." }, { status: 400 });
    }

    // Dynamically create a Prisma client with the provided URL
    prisma = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    // Attempt to connect and ping
    await prisma.$connect();
    await prisma.$runCommandRaw({ ping: 1 });

    return NextResponse.json({ message: "✓ Connection successful! Database is reachable." }, { status: 200 });
  } catch (error: any) {
    console.error("DB test error:", error.message);
    const msg = error.message?.split("\n")[0] || "Unknown error";
    return NextResponse.json(
      { message: `Connection failed: ${msg}` },
      { status: 500 }
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  }
}
