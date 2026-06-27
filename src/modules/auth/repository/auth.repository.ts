import { db } from "@/db";
import { users, sessions, loginHistory } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";

export const authRepository = {
  async findUserById(id: string) {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] ?? null;
  },

  async findUserByEmail(email: string) {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0] ?? null;
  },

  async findUserByResetToken(token: string) {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token))
      .limit(1);
    return results[0] ?? null;
  },

  async createUser(data: {
    organizationId: string | null;
    email: string;
    passwordHash: string;
    role: "super_admin" | "admin";
    name: string;
  }) {
    const [result] = await db
      .insert(users)
      .values({
        organizationId: data.organizationId,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        name: data.name,
      })
      .returning();
    return result;
  },

  async updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
    const [result] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result;
  },

  async createSession(data: { userId: string; organizationId: string | null; token: string; expiresAt: Date }) {
    const [result] = await db
      .insert(sessions)
      .values({
        userId: data.userId,
        organizationId: data.organizationId,
        token: data.token,
        expiresAt: data.expiresAt,
      })
      .returning();
    return result;
  },

  async findSessionByToken(token: string) {
    const results = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    return results[0] ?? null;
  },

  async deleteSessionByToken(token: string) {
    await db.delete(sessions).where(eq(sessions.token, token));
  },

  async deleteExpiredSessions(userId: string) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), lte(sessions.expiresAt, new Date())));
  },

  async logLogin(data: { userId: string; organizationId: string | null; ipAddress: string | null; userAgent: string | null; status: "success" | "failed" }) {
    const [result] = await db
      .insert(loginHistory)
      .values({
        userId: data.userId,
        organizationId: data.organizationId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: data.status,
      })
      .returning();
    return result;
  },

  async getLoginHistory(organizationId: string, limit = 50) {
    return db
      .select({
        id: loginHistory.id,
        userId: loginHistory.userId,
        userName: users.name,
        userEmail: users.email,
        ipAddress: loginHistory.ipAddress,
        userAgent: loginHistory.userAgent,
        status: loginHistory.status,
        timestamp: loginHistory.timestamp,
      })
      .from(loginHistory)
      .innerJoin(users, eq(users.id, loginHistory.userId))
      .where(eq(loginHistory.organizationId, organizationId))
      .orderBy(desc(loginHistory.timestamp))
      .limit(limit);
  },
};
