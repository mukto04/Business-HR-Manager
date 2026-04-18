import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Use the correct cookie name matching the login route
    const token = cookieStore.get("hr_auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || "appdevs-hr-portal-secure-vault-998877"
    );
    const { payload } = await jose.jwtVerify(token, secret);

    return NextResponse.json({
      companyName: payload.companyName,
      slug: payload.slug || payload.companyCode,
      role: payload.role
    });
  } catch (error) {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }
}
