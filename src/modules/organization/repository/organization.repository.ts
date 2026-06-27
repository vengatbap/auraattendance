import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const [result] = await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return result;
  },

  async delete(id: string) {
    await db.delete(organizations).where(eq(organizations.id, id));
  },
};
