import { toDateString } from "../src/utils";

const BASE_URL = "http://localhost:3001";

async function runTests() {
  console.log("=== STARTING AURA SYSTEM INTEGRATION API TESTS ===");
  let cookieHeader: string | null = null;
  const uniqueId = Date.now();
  const slug = `test-corp-${uniqueId}`;

  // Helper fetch function that passes cookies and content type
  async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    console.log("-> Response headers for", path, ":", Array.from(res.headers.entries()));

    // Support getSetCookie standard in modern Fetch implementation
    const setCookieHeaders = typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : (res.headers.get("Set-Cookie") ? [res.headers.get("Set-Cookie")!] : []);

    for (const setCookie of setCookieHeaders) {
      if (setCookie) {
        const cookieVal = setCookie.split(";")[0];
        if (cookieVal && cookieVal.includes("=")) {
          cookieHeader = cookieVal;
          console.log("-> Captured Session Cookie:", cookieHeader);
        }
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Request to ${path} failed with status ${res.status}: ${errText}`);
    }

    return res.json();
  }

  try {
    // 1. Health check
    console.log("\n[Test 1] Fetching Health Check Status...");
    const health = await apiFetch("/api/health");
    console.log("Health Status:", health);

    // 2. Version check
    console.log("\n[Test 2] Fetching System Version Details...");
    const version = await apiFetch("/api/version");
    console.log("Version Details:", version);

    // 3. Admin Signup
    console.log("\n[Test 3] Submitting Tenant Admin Signup...");
    const signup = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        organizationName: `Automated Test Corp ${uniqueId}`,
        organizationSlug: slug,
        ownerName: "Test Admin User",
        ownerEmail: `admin-${uniqueId}@testaura.com`,
        ownerPassword: "SuperSecurePassword123!",
      }),
    });
    const orgId = signup.data?.organization?.id;
    console.log("Signup Success:", signup.success, "Org ID:", orgId);

    // 4. Admin Login
    console.log("\n[Test 4] Verifying Admin Login...");
    const login = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: `admin-${uniqueId}@testaura.com`,
        password: "SuperSecurePassword123!",
      }),
    });
    console.log("Login Success:", login.user ? "true" : "false");

    // 5. Update Organization Settings
    console.log("\n[Test 5] Overwriting Settings Configuration...");
    const settingsUpdate = await apiFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        companyName: `Automated Test Corp ${uniqueId} Modified`,
        timezone: "Asia/Dubai",
        allowMultiplePunches: true,
        minimumPunchGapMinutes: 0, // set 0 to allow immediate punches for testing
        gracePeriodMinutes: 10,
        lateAfterTime: "09:30",
        faceMatchThreshold: 0.6,
      }),
    });
    console.log("Settings Updated:", settingsUpdate.success);

    // 6. Create Site Geofence
    console.log("\n[Test 6] Creating Workplace Site Geofence...");
    const site = await apiFetch("/api/sites", {
      method: "POST",
      body: JSON.stringify({
        name: "HQ Office Bahrain",
        latitude: 26.2285,
        longitude: 50.586,
        radius: 300,
        status: "active",
      }),
    });
    console.log("Created Site ID:", site.data?.id);
    const siteId = site.data?.id;

    // 7. Create Department
    console.log("\n[Test 7] Creating Organizational Department...");
    const dept = await apiFetch("/api/departments", {
      method: "POST",
      body: JSON.stringify({
        name: "Quality Assurance",
      }),
    });
    console.log("Created Dept ID:", dept.data?.id);
    const deptId = dept.data?.id;

    // 8. Create Employee Profile
    console.log("\n[Test 8] Enrolling Employee Staff Profile...");
    const employee = await apiFetch("/api/employees", {
      method: "POST",
      body: JSON.stringify({
        name: "Alex Tester",
        employeeCode: `CODE-${uniqueId}`,
        governmentId: `GOV-${uniqueId}`,
        email: `alex.tester-${uniqueId}@testaura.com`,
        phone: "+97339999999",
        departmentId: deptId,
        status: "active",
      }),
    });
    console.log("Created Employee ID:", employee.data?.id);
    const employeeId = employee.data?.id;

    // 9. Register Face Biometric Vector
    console.log("\n[Test 9] Registering Face Biometrics Descriptor Vector...");
    const descriptor = Array(128).fill(0.1); // mock face descriptor vector
    const face = await apiFetch("/api/faces/register", {
      method: "POST",
      body: JSON.stringify({
        employeeId: employeeId,
        descriptor: descriptor,
      }),
    });
    console.log("Face Registered:", face.success);

    // 10. Fetch Kiosk Synchronization Data
    console.log("\n[Test 10] Fetching Kiosk Offline Synchronization Assets...");
    const syncData = await apiFetch(`/api/attendance/kiosk-sync?org=${slug}`);
    console.log("Sync Profiles Count:", syncData.data?.profiles?.length, "Sites Count:", syncData.data?.sites?.length);

    // 11. Biometric Check-In Punch
    console.log("\n[Test 11] Submitting Biometric Check-In Punch...");
    // Mock slightly perturbed descriptor (Euclidean distance <= 0.6)
    const queryDescriptor = Array(128).fill(0.102); 
    const punchIn = await apiFetch("/api/attendance/punch", {
      method: "POST",
      body: JSON.stringify({
        orgSlug: slug,
        descriptor: queryDescriptor,
        latitude: 26.2286, // inside 300m radius of 26.2285
        longitude: 50.5861,
        photo: "data:image/jpeg;base64,mockphotoframebase64encoded",
        browser: "NodeTestRunner/1.0",
        deviceInfo: "Windows Server Test Node",
      }),
    });
    console.log("Punch In Result:", punchIn.success ? punchIn.data?.action : "FAILED", "Employee:", punchIn.data?.employee?.name);

    // 12. Biometric Check-Out Punch
    console.log("\n[Test 12] Submitting Biometric Check-Out Punch...");
    const punchOut = await apiFetch("/api/attendance/punch", {
      method: "POST",
      body: JSON.stringify({
        orgSlug: slug,
        descriptor: queryDescriptor,
        latitude: 26.2286,
        longitude: 50.5861,
        photo: "data:image/jpeg;base64,mockphotoframebase64encoded",
        browser: "NodeTestRunner/1.0",
        deviceInfo: "Windows Server Test Node",
      }),
    });
    console.log("Punch Out Result:", punchOut.success ? punchOut.data?.action : "FAILED", "Log ID:", punchOut.data?.attendanceLog?.id);

    // 13. Export Excel Report Sheet
    console.log("\n[Test 13] Requesting Excel Sheet Export...");
    const exportExcelRes = await fetch(`${BASE_URL}/api/reports/export?type=daily&date=${toDateString()}&format=excel`, {
      headers: cookieHeader ? { "Cookie": cookieHeader } : {},
    });
    console.log("Export Excel Status:", exportExcelRes.status, "Content-Type:", exportExcelRes.headers.get("Content-Type"));
    if (exportExcelRes.status !== 200) {
      throw new Error(`Excel export failed: ${await exportExcelRes.text()}`);
    }

    console.log("\n=== ALL AURA SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
  } catch (error) {
    console.error("\n!!! INTEGRATION TEST ENCOUNTERED AN ERROR !!!");
    console.error(error);
    process.exit(1);
  }
}

void runTests();
