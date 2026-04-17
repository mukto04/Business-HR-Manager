import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const HR_COOKIE = "hr_session";
const EMPLOYEE_COOKIE = "employee_session";

async function verifyToken(token: string, secret: string) {
  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, encodedSecret);
    return payload;
  } catch (err: any) {
    console.error("JWT Verify Error:", err.message);
    return null;
  }
}

// Public paths that don't require auth
const PUBLIC_PATHS = [
  "/login", 
  "/api/auth/login", 
  "/employee-login", 
  "/api/auth/employee-login",
  "/super-admin/login",
  "/api/super-admin/login"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static files and Next internals
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/favicon") || 
    pathname.startsWith("/images") ||
    pathname.startsWith("/api/setup") // Legacy but safe to keep for a moment
  ) {
    return NextResponse.next();
  }

  // 2. Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET || "hr-manager-super-secret-123-fallback";

  // 3. Super Admin Check (Page & API)
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
    const superAdminToken = request.cookies.get("super_session")?.value;
    const masterPassword = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";

    if (!superAdminToken || superAdminToken !== masterPassword) {
       // Allow the login page and login API
       if (pathname !== "/super-admin/login" && pathname !== "/api/super-admin/login") {
         return NextResponse.redirect(new URL("/super-admin/login", request.url));
       }
    }
    return NextResponse.next();
  }

  // 4. Check if it's an employee portal route
  if (
    pathname === "/employee" || 
    pathname.startsWith("/employee/") || 
    pathname === "/api/employee" || 
    pathname.startsWith("/api/employee/")
  ) {
    const employeeToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;
    const payload = employeeToken ? await verifyToken(employeeToken, secret) : null;
    
    if (!payload) {
      const loginUrl = new URL("/employee-login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 5. Check HR Dashboard routes (everything else)
  const hrToken = request.cookies.get(HR_COOKIE)?.value;
  const payload = hrToken ? await verifyToken(hrToken, secret) : null;

  if (!payload || payload.role !== "HR_ADMIN") {
    console.warn(`[Middleware] No valid HR_ADMIN payload at ${pathname}. Token present: ${!!hrToken}`);
    const loginUrl = new URL("/login", request.url);
    // Don't redirect the login page itself! (extra safety)
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
