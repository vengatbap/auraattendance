import { db } from "./index";
import { organizations, users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DEFAULT_ORGANIZATION } from "@/constants";

async function main() {
  console.log("Seeding database...");

  const orgsToSeed = [
    DEFAULT_ORGANIZATION,
    { name: "Acme Corporation", slug: "acme-corp" },
    { name: "Global Logistics Inc.", slug: "global-logistics" },
    { name: "Stark Industries", slug: "stark-industries" },
    { name: "Wayne Enterprises", slug: "wayne-enterprises" },
    { name: "Initech", slug: "initech" },
  ];

  for (const org of orgsToSeed) {
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, org.slug))
      .limit(1);

    if (existingOrg.length === 0) {
      await db.insert(organizations).values(org);
      console.log(`Organization created: ${org.name}`);
    } else {
      console.log(`Organization already exists: ${org.name}`);
    }
  }

  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@aura.com")).limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      organizationId: null, // Platform users are not tied to a specific organization
      email: "admin@aura.com",
      passwordHash,
      name: "Master",
      role: "super_admin",
      isPlatformUser: true,
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
