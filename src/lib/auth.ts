import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/constants";
import type { SessionPayload, UserRole } from "@/types";
import type { JWTPayload } from "jose";
import { AppError } from "@/lib/errors";

const secretKey = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as unknown as SessionPayload;
}

export async function loginSession(
  userId: string,
  role: UserRole,
  organizationId: string | null = null,
  isPlatformUser: boolean = false
) {
  const user = { userId, role, organizationId, isPlatformUser };
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt(user);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function logoutSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { expires: new Date(0), path: "/" });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function requireTenantContext() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
  
  // A platform user MUST use requirePlatformTenantAccess for support operations
  // They are NOT a regular tenant user and must not pass this check.
  if (session.isPlatformUser) {
    if (session.supportTenantId) {
       throw new AppError("Platform user must use requirePlatformTenantAccess to act as tenant", 403, "FORBIDDEN");
    }
    throw new AppError("Platform user cannot act as a tenant", 403, "FORBIDDEN");
  }

  if (!session.organizationId) {
    throw new AppError("Tenant context required", 403, "FORBIDDEN");
  }
  
  return session as SessionPayload & { organizationId: string };
}

export async function requirePlatformAccess() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
  
  if (!session.isPlatformUser) {
    throw new AppError("Platform access required", 403, "FORBIDDEN");
  }
  
  return session as SessionPayload & { isPlatformUser: true };
}

export async function requirePlatformTenantAccess() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
  
  if (!session.isPlatformUser) {
    throw new AppError("Platform access required", 403, "FORBIDDEN");
  }
  
  if (!session.supportTenantId) {
    throw new AppError("Support tenant context required", 403, "FORBIDDEN");
  }
  
  return session as SessionPayload & { isPlatformUser: true, supportTenantId: string };
}

export async function enterSupportSession(tenantId: string) {
  const session = await getSession();
  if (!session || !session.isPlatformUser) {
    throw new AppError("Only platform users can enter support mode", 403, "FORBIDDEN");
  }

  const payload = { ...session, supportTenantId: tenantId };
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const token = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function exitSupportSession() {
  const session = await getSession();
  if (!session || !session.isPlatformUser) return;

  const payload = { ...session };
  delete payload.supportTenantId;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const token = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
