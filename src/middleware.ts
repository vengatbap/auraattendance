import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/constants";
import { decrypt } from "@/lib/auth";

const protectedTenantRoutes = [
  "/dashboard",
  "/employees",
  "/sites",
  "/reports",
  "/settings",
];

const protectedPlatformRoutes = [
  "/admin",
];

const protectedApiRoutes = [
  "/api/admins",
  "/api/dashboard",
  "/api/employees",
  "/api/sites",
  "/api/reports",
  "/api/settings",
  "/api/audit-logs",
  "/api/attendance",
  "/api/faces/register",
  "/api/auth/me",
  "/api/admin", // Protect platform APIs
];

const publicApiRoutes = [
  "/api/attendance/punch",
  "/api/attendance/kiosk-sync",
  "/api/attendance/sync",
  "/api/health",
  "/api/version",
  "/api/auth/login",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  let session: { isPlatformUser?: boolean; supportTenantId?: string | null; userId?: string; role?: string } | null = null;

  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie.value);
    } catch {
      // Invalid session.
    }
  }

  const isTenantRoute = protectedTenantRoutes.some((route) => pathname.startsWith(route));
  const isPlatformRoute = protectedPlatformRoutes.some((route) => pathname.startsWith(route));
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route)) && !publicApiRoutes.some((route) => pathname.startsWith(route));

  // If no session and hitting protected route
  if ((isTenantRoute || isPlatformRoute) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If no session and hitting protected API
  if (isProtectedApiRoute && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session) {
    const isPlatformUser = session.isPlatformUser === true;
    const hasSupportContext = !!session.supportTenantId;

    if (pathname === "/login") {
      if (isPlatformUser) {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (isPlatformRoute) {
      if (!isPlatformUser) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (isTenantRoute) {
      if (isPlatformUser && !hasSupportContext) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    if (pathname.startsWith("/api/admin")) {
      if (!isPlatformUser) {
        return NextResponse.json({ error: "Forbidden: Platform access required" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
