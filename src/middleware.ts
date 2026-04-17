import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const HR_COOKIE = "hr_auth_token";
const EMPLOYEE_COOKIE = "employee_session";
const SESSION_SECRET_FALLBACK = "appdevs-hr-portal-secure-vault-998877";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/employee-login",
  "/api/auth/employee-login",
  "/public"
];

async function verifyToken(token: string) {
  try {
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || SESSION_SECRET_FALLBACK);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets
  if (
    pathname.includes(".") || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api/setup")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET || SESSION_SECRET_FALLBACK;

  // 3. Super Admin Check
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
    const adminToken = request.cookies.get("admin_session")?.value;
    const payload = adminToken ? await verifyToken(adminToken) : null;
    
    if (!payload || payload.role !== "SUPER_ADMIN") {
      if (pathname === "/super-admin/login" || pathname === "/api/super-admin/login") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
    return NextResponse.next();
  }

  // 4. Employee/HR Portal Check
  if (pathname.startsWith("/employee") || pathname.startsWith("/api/employee")) {
    const empToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;
    const payload = empToken ? await verifyToken(empToken) : null;
    if (!payload || payload.role !== "EMPLOYEE") {
       return NextResponse.redirect(new URL("/employee-login", request.url));
    }
    return NextResponse.next();
  }

  // 5. HR Admin Check (Default for / and others)
  const hrToken = request.cookies.get(HR_COOKIE)?.value;
  const payload = hrToken ? await verifyToken(hrToken) : null;

  if (!payload || payload.role !== "HR_ADMIN") {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
