import { db } from "@/db";
import { userInvitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/lib/errors";

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
    const [current] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.id, id))
      .limit(1);

    if (!current) throw new NotFoundError("Invitation not found");
    const currentVersion = current.version ?? 1;

    const [result] = await db
      .update(userInvitations)
      .set({ status, version: currentVersion + 1 })
      .where(
        and(
          eq(userInvitations.id, id),
          eq(userInvitations.version, currentVersion)
        )
      )
      .returning();

    if (!result) {
      throw new ConflictError("Concurrent modification detected. Please reload and try again.");
    }
    return result;
  },
};
