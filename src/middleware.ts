import { NextRequest, NextResponse } from "next/server";

const HR_COOKIE = "hr_auth_token";
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/employee-login",
  "/api/auth/employee-login",
  "/public"
];

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

  // 3. Super Admin & Employee checks (Simple presence check for Edge)
  if (pathname.startsWith("/super-admin")) {
    const adminToken = request.cookies.get("admin_session")?.value;
    if (!adminToken) {
       if (pathname === "/super-admin/login") return NextResponse.next();
       return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
  }

  const isEmployeePortal = pathname === "/employee" || pathname.startsWith("/employee/") || 
                           pathname === "/api/employee" || pathname.startsWith("/api/employee/");

  if (isEmployeePortal) {
    const empToken = request.cookies.get("employee_session")?.value;
    if (!empToken) return NextResponse.redirect(new URL("/employee-login", request.url));
  }

  // 4. HR Portal Check (The "No-Redirect-Loop" Logic)
  // We simply check if the cookie exists. 
  // The ACTUAL data security is handled in the API calls (Node.js side)
  // where we have already verified that token verification works perfectly.
  const hrToken = request.cookies.get(HR_COOKIE)?.value;

  if (!hrToken) {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If cookie exists, let them in. API routes will handle invalid/expired tokens.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
