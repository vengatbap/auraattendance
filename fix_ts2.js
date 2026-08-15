const fs = require('fs');

let f1 = 'src/app/dashboard/payroll/runs/[id]/page.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/employee\.firstName/g, 'employee.name');
c1 = c1.replace(/employee\.lastName/g, '""');
fs.writeFileSync(f1, c1);

let f2 = 'src/app/dashboard/payroll/runs/page.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/eq\(payrollPeriods\.organizationId, user\.organizationId\)/g, 'eq(payrollPeriods.organizationId, user.organizationId!)');
fs.writeFileSync(f2, c2);

let f3 = 'src/modules/payroll/repository/payroll-item.repository.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/presentDays: i\.presentDays,/g, 'presentDays: i.presentDays || 0,');
c3 = c3.replace(/paidLeaveDays: i\.paidLeaveDays,/g, 'paidLeaveDays: i.paidLeaveDays || 0,');
c3 = c3.replace(/unpaidLeaveDays: i\.unpaidLeaveDays,/g, 'unpaidLeaveDays: i.unpaidLeaveDays || 0,');
c3 = c3.replace(/absentDays: i\.absentDays,/g, 'absentDays: i.absentDays || 0,');
c3 = c3.replace(/overtimeHours: i\.overtimeHours,/g, 'overtimeHours: i.overtimeHours || "0",');
fs.writeFileSync(f3, c3);

let f4 = 'src/modules/payroll/services/payroll.service.ts';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/employeeId: item\.employeeId,/g, 'employeeId: item.employeeId,\n            organizationId,\n            payrollRunId: runId,');
fs.writeFileSync(f4, c4);
