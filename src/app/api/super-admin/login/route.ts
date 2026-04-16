import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const masterPassword = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";

    if (password !== masterPassword) {
      return NextResponse.json({ message: "Invalid super admin password." }, { status: 401 });
    }

    const response = NextResponse.json({ message: "Welcome, Super Admin." });

    // Set simple super session cookie
    response.cookies.set("super_session", masterPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
