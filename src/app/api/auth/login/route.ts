import { NextRequest, NextResponse } from "next/server";
import { masterPrisma } from "@/lib/prisma";
import * as jose from "jose";

const COOKIE_NAME = "hr_session";

export async function POST(request: NextRequest) {
  try {
    const { companyCode, username, password } = await request.json();

    if (!companyCode || !username || !password) {
      return NextResponse.json({ message: "Company code, username and password are required." }, { status: 400 });
    }

    // 1. Check Master DB for Tenant
    const tenant = await masterPrisma.tenant.findUnique({
      where: { companyCode: companyCode.toUpperCase() }
    });

    if (!tenant) {
      return NextResponse.json({ message: "Invalid company code." }, { status: 404 });
    }

    if (tenant.status === "FROZEN") {
      return NextResponse.json({ message: "Your company account is frozen. Please contact administration." }, { status: 403 });
    }

    // 2. Tenant Credential Check
    if (username !== tenant.adminUsername || password !== tenant.adminPassword) {
        return NextResponse.json({ message: "Invalid username or password for this company." }, { status: 401 });
    }

    // 3. Create Session Token (JWT) with Dynamic DB URL
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");
    
    const token = await new jose.SignJWT({
      companyCode: tenant.companyCode,
      companyName: tenant.companyName,
      dbUrl: tenant.dbUrl,
      role: "HR_ADMIN"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    const response = NextResponse.json({ 
      message: "Login successful",
      companyName: tenant.companyName 
    });

    // 4. Set Session Cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Multi-tenant login error:", error);
    return NextResponse.json({ message: "An unexpected error occurred during login." }, { status: 500 });
  }
}
