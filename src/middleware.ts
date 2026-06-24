import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/constants";
import { decrypt } from "@/lib/auth";

const protectedRoutes = [
  "/dashboard",
  "/employees",
  "/sites",
  "/reports",
  "/settings",
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
  "/api/attendance/adjust",
  "/api/attendance/checkin",
  "/api/attendance/checkout",
  "/api/attendance/punch",
  "/api/attendance/recognize",
  "/api/faces",
  "/api/faces/register",
  "/api/faces/[id]",
  "/api/auth/me",
  "/api/attendance/summary",
];

const publicApiRoutes = [
  "/api/attendance/punch",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  let session = null;

  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie.value);
    } catch {
      // Invalid session.
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route));
  const isPublicApiRoute = publicApiRoutes.includes(pathname) || (pathname === "/api/sites" && request.method === "GET");

  if (isProtectedApiRoute && !isPublicApiRoute && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
