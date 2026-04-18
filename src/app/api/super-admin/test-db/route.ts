import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { dbUrl } = await request.json();

    if (!dbUrl || typeof dbUrl !== "string") {
      return NextResponse.json({ message: "Missing or invalid connection string." }, { status: 400 });
    }

    // Try to connect with a short timeout
    const client = new MongoClient(dbUrl, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });

    await client.connect();
    await client.db().command({ ping: 1 });
    await client.close();

    return NextResponse.json({ message: "✓ Connection successful! Database is reachable." }, { status: 200 });
  } catch (error: any) {
    console.error("DB test error:", error.message);
    return NextResponse.json(
      { message: `Connection failed: ${error.message?.split("\n")[0] || "Unknown error"}` },
      { status: 500 }
    );
  }
}
