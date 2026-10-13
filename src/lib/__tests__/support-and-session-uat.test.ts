import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";

const { mockCookieStore } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    mockCookieStore: store,
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = mockCookieStore.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, value: string) => {
      mockCookieStore.set(name, value);
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

import {
  encrypt,
  decrypt,
  enterSupportSession,
  exitSupportSession,
  requireTenantContext,
  requirePlatformAccess,
  requirePlatformTenantAccess,
} from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { UserRole } from "@/modules/permissions/types";
import { AuditService } from "@/modules/audit/service/audit.service";
import { db } from "@/db";
import { organizations, users, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@/constants";

describe("🔐 Step 5 & Step 6: Support Mode, Audit Attribution & Session Lifecycle UAT", () => {
  let testOrgId: string;
  let testSuperAdminId: string;

  beforeAll(async () => {
    // Create test organization and user
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Support Audit Test Org",
        slug: "support-audit-" + Date.now(),
      })
      .returning();
    testOrgId = org.id;

    const [superUser] = await db
      .insert(users)
      .values({
        email: `superaudit_${Date.now()}@aura.io`,
        name: "Super Audit Director",
        role: "SUPERADMIN",
        isPlatformUser: true,
        passwordHash: "mock-hash",
      })
      .returning();
    testSuperAdminId = superUser.id;
  });

  afterAll(async () => {
    if (testOrgId) {
      await db.delete(auditLogs).where(eq(auditLogs.organizationId, testOrgId));
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    }
    if (testSuperAdminId) {
      await db.delete(users).where(eq(users.id, testSuperAdminId));
    }
  });

  beforeEach(() => {
    mockCookieStore.clear();
  });

  const superAdminPayload = {
    userId: "usr_super_001",
    email: "superadmin@aura.io",
    name: "Global Platform Director",
    role: "SUPERADMIN" as UserRole,
    isPlatformUser: true,
    organizationId: null,
  };

  const tenantAdminPayload = {
    userId: "usr_tenant_001",
    email: "admin@bahrainwater.com",
    name: "Bahrain Water Admin",
    role: "ADMIN" as UserRole,
    isPlatformUser: false,
    organizationId: "org_bws_101",
  };

  describe("--- Step 5: Support Mode & Audit Attribution ---", () => {
    it("1. Platform user cannot access regular tenant context without Support Mode", async () => {
      const token = await encrypt(superAdminPayload);
      mockCookieStore.set(SESSION_COOKIE_NAME, token);

      await expect(requireTenantContext()).rejects.toThrow("Platform user cannot act as a tenant");
    });

    it("2. Tenant user cannot access Platform Admin area", async () => {
      const user = {
        id: tenantAdminPayload.userId,
        organizationId: tenantAdminPayload.organizationId,
        role: tenantAdminPayload.role,
        isPlatformUser: false,
      };

      expect(PermissionService.can(user, "platform.organizations.read")).toBe(false);
      expect(PermissionService.can(user, "platform.dashboard.read")).toBe(false);
      expect(PermissionService.can(user, "platform.organizations.update")).toBe(false);
      expect(PermissionService.cannot(user, "platform.organizations.read")).toBe(true);
    });

    it("3. Support Mode creates temporary tenant context while preserving permanent platform identity", async () => {
      const supportSession = {
        ...superAdminPayload,
        supportTenantId: "org_bws_101",
      };

      const token = await encrypt(supportSession);
      const decrypted = await decrypt(token);

      expect(decrypted?.isPlatformUser).toBe(true);
      expect(decrypted?.userId).toBe("usr_super_001");
      expect(decrypted?.supportTenantId).toBe("org_bws_101");
      expect(decrypted?.role).toBe("SUPERADMIN");
    });

    it("4. Support Mode cannot be switched into another tenant without cryptographic signature", async () => {
      const initialSupportSession = {
        ...superAdminPayload,
        supportTenantId: "org_bws_101",
      };

      const token = await encrypt(initialSupportSession);
      mockCookieStore.set(SESSION_COOKIE_NAME, token);

      const session = await requirePlatformTenantAccess();
      expect(session.supportTenantId).toBe("org_bws_101");

      // An un-signed manipulation attempt cannot alter tenant target
      const forgedToken = token.slice(0, -10) + "tampered00";
      mockCookieStore.set(SESSION_COOKIE_NAME, forgedToken);
      await expect(requirePlatformTenantAccess()).rejects.toThrow("Unauthorized");
    });

    it("5. Exit Support Mode removes tenant context immediately", async () => {
      const token = await encrypt(superAdminPayload);
      mockCookieStore.set(SESSION_COOKIE_NAME, token);

      await enterSupportSession("org_bws_101");
      let currentSession = await requirePlatformTenantAccess();
      expect(currentSession.supportTenantId).toBe("org_bws_101");

      await exitSupportSession();
      await expect(requirePlatformTenantAccess()).rejects.toThrow("Support tenant context required");
    });

    it(
      "6. Audits enter/exit Support Mode with accurate actor and tenant attribution",
      async () => {
        // Log ENTER_SUPPORT_MODE
        await AuditService.log({
          organizationId: testOrgId,
          userId: testSuperAdminId,
          action: "ENTER_SUPPORT_MODE",
          entity: "system",
          details: { actor: "superadmin@aura.io", targetTenant: testOrgId, supportContext: true },
        });

        // Log action inside Support Mode (e.g. employee adjustment)
        await AuditService.log({
          organizationId: testOrgId,
          userId: testSuperAdminId,
          action: "ATTENDANCE_ADJUSTED",
          entity: "attendance_adjustments",
          details: {
            performedByPlatformUser: true,
            platformUserId: testSuperAdminId,
            reason: "Support mode diagnostic correction",
          },
        });

        // Log EXIT_SUPPORT_MODE
        await AuditService.log({
          organizationId: testOrgId,
          userId: testSuperAdminId,
          action: "EXIT_SUPPORT_MODE",
          entity: "system",
          details: { actor: "superadmin@aura.io", targetTenant: testOrgId },
        });

        // Query audit logs to verify compliance
        const logs = await db.query.auditLogs.findMany({
          where: eq(auditLogs.organizationId, testOrgId),
          orderBy: [desc(auditLogs.createdAt)],
        });

        expect(logs.length).toBeGreaterThanOrEqual(3);
        const actions = logs.map((l) => l.action);
        expect(actions).toContain("ENTER_SUPPORT_MODE");
        expect(actions).toContain("ATTENDANCE_ADJUSTED");
        expect(actions).toContain("EXIT_SUPPORT_MODE");

        // Verify all entries attributed to Super Admin userId
        for (const log of logs) {
          expect(log.userId).toBe(testSuperAdminId);
        }
      },
      15000
    );
  });

  describe("--- Step 6: Session Expiry & Logout Lifecycle ---", () => {
    it("1. Malformed or invalid JWT strings return null cleanly without throwing uncaught exceptions", async () => {
      expect(await decrypt("")).toBeNull();
      expect(await decrypt("not.a.valid.jwt.token")).toBeNull();
      expect(await decrypt("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature")).toBeNull();
    });

    it("2. Valid session decrypts accurately", async () => {
      const validPayload = {
        userId: "usr_active_001",
        organizationId: "org_bws_101",
        role: "ADMIN" as UserRole,
        isPlatformUser: false,
      };

      const token = await encrypt(validPayload);
      const decrypted = await decrypt(token);

      expect(decrypted?.userId).toBe("usr_active_001");
      expect(decrypted?.organizationId).toBe("org_bws_101");
      expect(decrypted?.role).toBe("ADMIN");
    });

    it("3. Unauthenticated session throws UNAUTHORIZED in requireTenantContext", async () => {
      mockCookieStore.clear();
      await expect(requireTenantContext()).rejects.toThrow("Unauthorized");
    });

    it("4. Unauthenticated session throws UNAUTHORIZED in requirePlatformAccess", async () => {
      mockCookieStore.clear();
      await expect(requirePlatformAccess()).rejects.toThrow("Unauthorized");
    });

    it("5. Tenant user cannot pass requirePlatformAccess", async () => {
      const token = await encrypt(tenantAdminPayload);
      mockCookieStore.set(SESSION_COOKIE_NAME, token);
      await expect(requirePlatformAccess()).rejects.toThrow("Platform access required");
    });
  });
});
