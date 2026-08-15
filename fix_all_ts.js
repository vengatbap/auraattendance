const fs = require('fs');
const path = require('path');

function replaceAll(file, searchRegex, replaceStr) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(searchRegex, replaceStr);
    fs.writeFileSync(file, content);
  }
}

// 1. Missing createApiResponse imports
const apiFiles = [
  'periods/[id]/runs/route.ts',
  'periods/route.ts',
  'runs/[id]/approve/route.ts',
  'runs/[id]/calculate/route.ts',
  'runs/[id]/lock/route.ts',
  'runs/[id]/payslips/route.ts',
  'runs/[id]/route.ts',
  'salary/[employeeId]/route.ts',
  'salary/route.ts'
];
apiFiles.forEach(f => {
  const fullPath = path.join('src/app/api/payroll', f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('createApiResponse') && !content.includes('import { createApiResponse')) {
      content = 'import { createApiResponse } from "@/lib/api-response";\n' + content;
      fs.writeFileSync(fullPath, content);
    }
  }
});

// 2. Permission string mismatches
replaceAll('src/app/api/payroll/periods/[id]/runs/route.ts', /"payroll\.run"/g, '"payroll.create"');
replaceAll('src/app/api/payroll/periods/route.ts', /"payroll\.run"/g, '"payroll.create"');
replaceAll('src/app/api/payroll/runs/[id]/calculate/route.ts', /"payroll\.run"/g, '"payroll.calculate"');

// 3. getPayrollSummary missing
const leaveSummaryStr = `
  static async getPayrollSummary(
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<LeavePayrollSummary> {
    const batch = await this.getBatchPayrollSummaries(organizationId, [employeeId], periodStart, periodEnd);
    return batch[employeeId];
  }
`;
let leaveService = fs.readFileSync('src/modules/leave/service/leave.service.ts', 'utf8');
if (!leaveService.includes('static async getPayrollSummary(')) {
  leaveService = leaveService.replace('static async getBatchPayrollSummaries(', leaveSummaryStr + '\n  static async getBatchPayrollSummaries(');
  fs.writeFileSync('src/modules/leave/service/leave.service.ts', leaveService);
}
replaceAll('src/app/api/leave/payroll-summary/route.ts', /getPayrollSummary/g, 'getPayrollSummary'); // Wait, it already says getPayrollSummary, just need to restore it in LeaveService.

// 4. Catch block `unknown` error typing in ui pages
function replaceUnknownCatch(file) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    // For pages, usually the error is just checked for message or logged. We can cast err as any or Error.
    c = c.replace(/catch \(r\) \{/g, 'catch (r: any) {');
    c = c.replace(/catch \(t\) \{/g, 'catch (t: any) {');
    c = c.replace(/catch \(err\) \{/g, 'catch (err: any) {');
    fs.writeFileSync(file, c);
  }
}
replaceUnknownCatch('src/app/dashboard/leave/requests/page.tsx');
replaceUnknownCatch('src/app/dashboard/leave/types/page.tsx');
replaceUnknownCatch('src/modules/attendance-engine/services/offline-sync.service.ts');

// 5. Drizzle SQL wrappers (user.organizationId!)
replaceAll('src/app/dashboard/payroll/runs/[id]/page.tsx', 
  /eq\(payrollRuns\.organizationId, user\.organizationId\)/g, 
  'eq(payrollRuns.organizationId, user.organizationId!)');
replaceAll('src/app/dashboard/payroll/runs/[id]/page.tsx', 
  /eq\(payrollItems\.organizationId, user\.organizationId\)/g, 
  'eq(payrollItems.organizationId, user.organizationId!)');
replaceAll('src/app/dashboard/payroll/runs/page.tsx', 
  /eq\(payrollPeriods\.organizationId, user\.organizationId\)/g, 
  'eq(payrollPeriods.organizationId, user.organizationId!)');

// 6. Layout missing Inter
replaceAll('src/app/layout.tsx', /<body className=\{inter\.className\}>/g, '<body>');
replaceAll('src/app/layout.tsx', /const inter = /g, '// const inter = ');

// 7. Auth number vs string for status
replaceAll('src/lib/auth.ts', /status: "401"/g, 'status: 401');
replaceAll('src/lib/auth.ts', /status: "403"/g, 'status: 403');

// 8. Persist stage issues
replaceAll('src/modules/attendance-engine/stages/persist-stage.ts', 
  /const existingLog = \{\} as any;/g, 
  'const existingLog: any = {};');

// 9. Leave test issues
replaceAll('src/modules/leave/__tests__/leave.service.test.ts', 
  /LeaveService\.getBatchPayrollSummaries\(orgId, empId/g, 
  'LeaveService.getBatchPayrollSummaries(orgId, [empId]');
replaceAll('src/modules/leave/__tests__/leave.service.test.ts', 
  /summary === /g, 
  'summary.approvedLeaveDays === ');
replaceAll('src/modules/leave/__tests__/leave.service.test.ts', 
  /summary\.paidLeaveDays === /g, 
  'summary.paidLeaveDays === ');
replaceAll('src/modules/leave/__tests__/leave.service.test.ts', 
  /summary\.unpaidLeaveDays === /g, 
  'summary.unpaidLeaveDays === ');

// 10. Payroll engine type mismatch
replaceAll('src/modules/payroll/engine/payroll-engine.ts', /as Allowance\[\]/g, 'as { amount: string }[]');
replaceAll('src/modules/payroll/engine/payroll-engine.ts', /as Deduction\[\]/g, 'as { amount: string }[]');
replaceAll('src/modules/payroll/engine/payroll-engine.ts', 
  /employeeId: ctx\.employeeId,/g, 
  'organizationId, payrollRunId: runId, employeeId: ctx.employeeId,');

// 11. payroll-item.repository.ts
replaceAll('src/modules/payroll/repository/payroll-item.repository.ts', /i\.presentDays/g, 'i.presentDays || 0');
replaceAll('src/modules/payroll/repository/payroll-item.repository.ts', /i\.paidLeaveDays/g, 'i.paidLeaveDays || 0');
replaceAll('src/modules/payroll/repository/payroll-item.repository.ts', /i\.unpaidLeaveDays/g, 'i.unpaidLeaveDays || 0');
replaceAll('src/modules/payroll/repository/payroll-item.repository.ts', /i\.absentDays/g, 'i.absentDays || 0');
replaceAll('src/modules/payroll/repository/payroll-item.repository.ts', /i\.overtimeHours/g, 'i.overtimeHours || "0"');

// 12. payroll.service.ts object literal multiple properties
let payrollService = fs.readFileSync('src/modules/payroll/services/payroll.service.ts', 'utf8');
payrollService = payrollService.replace(/organizationId,\n\s*payrollRunId: runId,\n\s*organizationId,\n\s*payrollRunId: runId,/g, 'organizationId,\n            payrollRunId: runId,');
fs.writeFileSync('src/modules/payroll/services/payroll.service.ts', payrollService);
