import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/constants";
import type { SessionPayload, UserRole } from "@/types";
import type { JWTPayload } from "jose";

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

export async function loginSession(userId: string, role: UserRole, organizationId: string | null = null) {
  const user = { userId, role, organizationId };
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
