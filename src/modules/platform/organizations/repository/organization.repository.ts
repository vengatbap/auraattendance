import { db } from "@/db";
import { organizations, users, employees, attendanceLogs } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/lib/errors";

export const organizationRepository = {
  async findById(id: string) {
    const results = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return results[0] ?? null;
  },

  async findBySlug(slug: string) {
    const results = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    return results[0] ?? null;
  },

  async create(data: {
    name: string;
    slug: string;
    subscriptionPlan?: string;
    trialEndsAt?: Date;
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }) {
    const [result] = await db
      .insert(organizations)
      .values({
        name: data.name,
        slug: data.slug,
        subscriptionPlan: data.subscriptionPlan ?? "trial",
        trialEndsAt: data.trialEndsAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        logo: data.logo ?? null,
        favicon: data.favicon ?? null,
        primaryColor: data.primaryColor ?? "#2563eb",
        secondaryColor: data.secondaryColor ?? "#4f46e5",
      })
      .returning();
    return result;
  },

  async update(id: string, data: Partial<typeof organizations.$inferInsert>) {
    const current = await this.findById(id);
    if (!current) throw new NotFoundError("Organization not found");
    const currentVersion = current.version ?? 1;

    const [result] = await db
      .update(organizations)
      .set({
        ...data,
        version: currentVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizations.id, id),
          eq(organizations.version, currentVersion)
        )
      )
      .returning();

    if (!result) {
      throw new ConflictError("Concurrent modification detected. Please reload and try again.");
    }
    return result;
  },

  async delete(id: string) {
    await db.delete(organizations).where(eq(organizations.id, id));
  },

  async getGlobalSystemStats() {
    const [orgCount, userCount, employeeCount, punchCount, planBreakdown] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(organizations).then((res) => Number(res[0].count)),
      db.select({ count: sql<number>`count(*)` }).from(users).then((res) => Number(res[0].count)),
      db.select({ count: sql<number>`count(*)` }).from(employees).then((res) => Number(res[0].count)),
      db.select({ count: sql<number>`count(*)` }).from(attendanceLogs).then((res) => Number(res[0].count)),
      db.select({ plan: organizations.subscriptionPlan, count: sql<number>`count(*)` }).from(organizations).groupBy(organizations.subscriptionPlan),
    ]);

    return {
      orgCount,
      userCount,
      employeeCount,
      punchCount,
      plans: planBreakdown.reduce((acc, curr) => {
        acc[curr.plan] = Number(curr.count);
        return acc;
      }, {} as Record<string, number>),
    };
  },
};
