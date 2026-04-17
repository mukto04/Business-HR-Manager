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

    // 1. Initial Checks
    if (!process.env.DATABASE_URL) {
      console.error("CRITICAL: DATABASE_URL is not set in environment.");
      return NextResponse.json({ message: "Server configuration error: Database URL missing." }, { status: 500 });
    }

    const tenant = await masterPrisma.tenant.findUnique({
      where: { companyCode: companyCode.toUpperCase() }
    });

    if (!tenant) {
      console.warn(`Login attempt for non-existent company: ${companyCode}`);
      return NextResponse.json({ message: `Invalid company code: ${companyCode}` }, { status: 404 });
    }

    if (tenant.status === "FROZEN") {
      return NextResponse.json({ message: "Your company account is frozen. Please contact administration." }, { status: 403 });
    }

    // 2. Tenant Credential Check
    if (username !== tenant.adminUsername || password !== tenant.adminPassword) {
        console.warn(`Invalid credentials for company ${companyCode}: User ${username}`);
        return NextResponse.json({ message: "Invalid username or password for this company." }, { status: 401 });
    }

    // 3. Create Session Token (JWT) with Dynamic DB URL
    const secretKey = process.env.SESSION_SECRET || "hr-manager-super-secret-123-fallback";
    const secret = new TextEncoder().encode(secretKey);
    
    console.log(`Generating token for ${tenant.companyName} (${tenant.companyCode})`);

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
    const oneDay = 24 * 60 * 60 * 1000;
    const expires = new Date(Date.now() + oneDay);

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      expires: expires,
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
      secure: true, // Always secure for modern browsers on Vercel
    });

    console.log(`[Login] Successful. Token length: ${token.length}. Expires: ${expires.toISOString()}`);
    return response;
  } catch (error: any) {
    console.error("Multi-tenant login error:", error);
    return NextResponse.json({ 
      message: "An unexpected error occurred during login.",
      detail: error.message 
    }, { status: 500 });
  }
}
