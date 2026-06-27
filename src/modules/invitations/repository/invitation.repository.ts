import { db } from "@/db";
import { userInvitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const invitationRepository = {
  async findByToken(token: string) {
    const results = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token))
      .limit(1);
    return results[0] ?? null;
  },

  async findByEmailAndOrg(email: string, organizationId: string) {
    const results = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.email, email),
          eq(userInvitations.organizationId, organizationId)
        )
      )
      .limit(1);
    return results[0] ?? null;
  },

  async create(data: { organizationId: string; email: string; token: string; expiresAt: Date }) {
    const [result] = await db
      .insert(userInvitations)
      .values({
        organizationId: data.organizationId,
        email: data.email,
        token: data.token,
        status: "pending",
        expiresAt: data.expiresAt,
      })
      .returning();
    return result;
  },

  async updateStatus(id: string, status: "pending" | "accepted" | "expired") {
    const [result] = await db
      .update(userInvitations)
      .set({ status })
      .where(eq(userInvitations.id, id))
      .returning();
    return result;
  },
};
