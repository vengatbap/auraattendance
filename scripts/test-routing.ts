import { middleware } from "../src/middleware";
import { NextRequest } from "next/server";
import { encrypt } from "../src/lib/auth";

async function runTests() {
  console.log("Running Routing / Security Tests...\n");
  let passed = 0;
  let total = 0;

  async function test(name: string, sessionPayload: any, url: string, expectedStatus: number, expectedRedirect?: string) {
    total++;
    try {
      const cookieValue = sessionPayload ? await encrypt(sessionPayload) : null;
      
      const req = new NextRequest(new URL(url, "http://localhost:3000"));
      if (cookieValue) {
        req.cookies.set("session", cookieValue);
      }

      const res = await middleware(req);
      const status = res.status;
      const redirectUrl = res.headers.get("location");

      let success = status === expectedStatus;
      if (expectedRedirect && redirectUrl) {
        success = success && redirectUrl.endsWith(expectedRedirect);
      }

      if (success) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${name} (Expected status ${expectedStatus} ${expectedRedirect ? '-> ' + expectedRedirect : ''}, got ${status} ${redirectUrl ? '-> ' + redirectUrl : ''})`);
      }
    } catch (e) {
       console.log(`❌ FAIL: ${name} (Exception: ${e})`);
    }
  }

  const superAdmin = { userId: "1", role: "super_admin", isPlatformUser: true, organizationId: null };
  const tenantAdmin = { userId: "2", role: "admin", isPlatformUser: false, organizationId: "org_1" };
  const viewer = { userId: "3", role: "viewer", isPlatformUser: false, organizationId: "org_1" };
  const platformSupport = { userId: "1", role: "super_admin", isPlatformUser: true, organizationId: null, supportTenantId: "org_1" };

  await test("A. admin@aura.com login redirect", superAdmin, "/login", 307, "/admin");
  await test("B. Tenant admin login redirect", tenantAdmin, "/login", 307, "/dashboard");
  await test("C. Tenant admin accessing /admin", tenantAdmin, "/admin/organizations", 307, "/dashboard");
  await test("D. Viewer accessing /admin", viewer, "/admin/system", 307, "/dashboard");
  await test("E. Platform admin accessing /admin", superAdmin, "/admin", 200);
  await test("F. Platform admin accessing /dashboard without support context", superAdmin, "/dashboard", 307, "/admin");
  await test("G. Platform admin accessing /dashboard WITH support context", platformSupport, "/dashboard", 200);
  await test("H. Anonymous accessing /admin", null, "/admin", 307, "/login");
  await test("I. Anonymous accessing /dashboard", null, "/dashboard", 307, "/login");

  console.log(`\nResults: ${passed}/${total} passed.`);
  if (passed !== total) process.exit(1);
}

runTests();
