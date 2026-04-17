import { NextRequest, NextResponse } from "next/server";

const HR_COOKIE = "hr_auth_token";
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/employee-login",
  "/api/auth/employee-login",
  "/super-admin/login",
  "/api/super-admin/login",
  "/public"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and internal next.js files
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

  // 3. Super Admin Route Protection (UI & API)
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
    const adminToken = request.cookies.get("super_session")?.value;
    // Allow login API to pass through
    if (pathname === "/api/super-admin/login") return NextResponse.next();
    
    if (!adminToken) {
       if (pathname === "/super-admin/login") return NextResponse.next();
       return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
    return NextResponse.next(); // Stop here for super-admin verified requests
  }

  // 4. Employee Portal Route Protection (UI & API)
  const isEmployeeRoute = pathname.startsWith("/employee") || pathname.startsWith("/api/employee");
  const isHREmployeePage = pathname === "/employees" || pathname.startsWith("/employees/");

  if (isEmployeeRoute && !isHREmployeePage) {
    const empToken = request.cookies.get("employee_session")?.value;
    if (!empToken) return NextResponse.redirect(new URL("/employee-login", request.url));
    return NextResponse.next(); // Stop here for employee verified requests
  }

  // 5. HR Portal Check (Default catch-all for / and HR Specific routes)
  // This will handle "/", "/employees", "/attendance", etc.
  const hrToken = request.cookies.get(HR_COOKIE)?.value;

  if (!hrToken) {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
