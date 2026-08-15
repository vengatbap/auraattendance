const fs = require('fs');

let f1 = 'src/modules/payroll/engine/payroll-engine.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/fixedAllowances: salary\.fixedAllowances as any,/g, 'fixedAllowances: (salary.fixedAllowances as unknown) as Allowance[],');
c1 = c1.replace(/fixedDeductions: salary\.fixedDeductions as any,/g, 'fixedDeductions: (salary.fixedDeductions as unknown) as Deduction[],');
c1 = c1.replace(/calculationSnapshot: \{\} as any/g, 'calculationSnapshot: {} as PayrollCalculationContext["calculationSnapshot"]');
fs.writeFileSync(f1, c1);

let f2 = 'src/modules/payroll/repository/payroll-item.repository.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/items: any\[\]/g, 'items: (typeof payrollItems.$inferInsert)[]');
fs.writeFileSync(f2, c2);

let f3 = 'src/modules/payroll/repository/payslip.repository.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/items: any\[\]/g, 'items: (typeof payslips.$inferInsert)[]');
fs.writeFileSync(f3, c3);

let f4 = 'src/modules/payroll/services/payroll.service.ts';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/const snapshot = item\.calculationSnapshot as any;/g, 'const snapshot = item.calculationSnapshot as unknown as { salary?: { currency: string } };');
fs.writeFileSync(f4, c4);
