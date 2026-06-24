import { db } from "./index";
import { organizations, users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DEFAULT_ORGANIZATION } from "@/constants";

async function main() {
  console.log("Seeding database...");

  const existingOrganization = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, DEFAULT_ORGANIZATION.slug))
    .limit(1);

  const organization = existingOrganization[0] ?? (
    await db
      .insert(organizations)
      .values(DEFAULT_ORGANIZATION)
      .returning()
  )[0];

  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@aura.com")).limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      organizationId: organization.id,
      email: "admin@aura.com",
      passwordHash,
      name: "Master",
      role: "super_admin",
    });
    console.log("Super Admin created successfully (admin@aura.com / admin123)");
  } else {
    console.log("Super Admin already exists.");
  }

  console.log("Seeding finished.");
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
