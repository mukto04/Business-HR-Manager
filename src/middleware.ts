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

// Helper to check if a path exactly match or is a subpath of a prefix (e.g. /employee match /employee/1 but not /employees)
function matchPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
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

  // 2. Allow public paths & handle dynamic company URIs
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Handle dynamic /[slug]-hr paths
  if (pathname.endsWith("-hr")) {
    const slug = pathname.replace("-hr", "").substring(1); // Remove leading slash and suffix
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("slug", slug);
      return NextResponse.rewrite(url);
    }
  }

  // Handle dynamic /[slug]-employee paths
  if (pathname.endsWith("-employee")) {
    const slug = pathname.replace("-employee", "").substring(1);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = "/employee-login";
      url.searchParams.set("slug", slug);
      return NextResponse.rewrite(url);
    }
  }

  // 3. Super Admin Route Protection (UI & API)
  if (matchPath(pathname, "/super-admin") || matchPath(pathname, "/api/super-admin")) {
    const adminToken = request.cookies.get("super_session")?.value;
    if (pathname === "/api/super-admin/login") return NextResponse.next();
    
    if (!adminToken) {
       if (pathname === "/super-admin/login") return NextResponse.next();
       return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
    
    // Redirect /super-admin to /super-admin/tenants for authenticated admins
    if (pathname === "/super-admin") {
      return NextResponse.redirect(new URL("/super-admin/tenants", request.url));
    }
    
    return NextResponse.next();
  }

  // 4. Employee Portal Route Protection (UI & API)
  // We use strict matching here to avoid conflict with /employees (plural)
  const isEmployeePortal = matchPath(pathname, "/employee") || matchPath(pathname, "/api/employee");

  if (isEmployeePortal) {
    const empToken = request.cookies.get("employee_session")?.value;
    if (!empToken) return NextResponse.redirect(new URL("/employee-login", request.url));
    return NextResponse.next();
  }

  // 5. HR Portal Check (Fallback)
  // Everything else (/, /employees, /attendance, etc.) is considered HR territory
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
