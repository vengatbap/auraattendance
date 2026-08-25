import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { payrollRuns, payrollItems, payslips, employees } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import RunDetailsClient from "./RunDetailsClient";
import Link from "next/link";
import { AlertCircle, FileText, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function RunDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTenantContext();
  if (PermissionService.cannot(session, "payroll.read")) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const run = await db.query.payrollRuns.findFirst({
    where: and(
      eq(payrollRuns.id, id),
      eq(payrollRuns.organizationId, session.organizationId)
    ),
    with: {
      period: true,
    }
  });

  if (!run) {
    return <div className="p-6">Run not found</div>;
  }

  const items = await db.query.payrollItems.findMany({
    where: and(
      eq(payrollItems.payrollRunId, id),
      eq(payrollItems.organizationId, session.organizationId)
    ),
    with: {
      employee: true,
    }
  });

  const activeEmployees = await db.query.employees.findMany({
    where: and(
      eq(employees.organizationId, session.organizationId),
      eq(employees.status, "active"),
      isNull(employees.deletedAt)
    )
  });

  const runPayslips = await db.query.payslips.findMany({
    where: and(
      eq(payslips.payrollRunId, id),
      eq(payslips.organizationId, session.organizationId)
    )
  });

  const displayStatus = run.status === "PAID" ? "LOCKED" : run.status;
  
  // Identify missing salaries
  const itemEmployeeIds = new Set(items.map(i => i.employeeId));
  const missingEmployees = activeEmployees.filter(e => !itemEmployeeIds.has(e.id));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pay Run Details</h1>
          <p className="text-muted-foreground mt-1">
            {run.period?.name} ({run.period?.periodStart} to {run.period?.periodEnd})
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold tracking-wide">
            {displayStatus}
          </span>
        </div>
      </div>

      <RunDetailsClient runId={run.id} status={run.status} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Employees Processed</p>
          <p className="text-2xl font-bold mt-1">{run.employeeCount || 0}</p>
        </div>
        <div className="bg-white p-5 border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Gross Total</p>
          <p className="text-2xl font-bold mt-1 text-green-700">${run.grossTotal || "0.00"}</p>
        </div>
        <div className="bg-white p-5 border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Deductions Total</p>
          <p className="text-2xl font-bold mt-1 text-red-700">${run.deductionTotal || "0.00"}</p>
        </div>
        <div className="bg-white p-5 border rounded-lg shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Net Total</p>
          <p className="text-2xl font-bold mt-1">${run.netTotal || "0.00"}</p>
        </div>
      </div>

      {missingEmployees.length > 0 && run.status !== "DRAFT" && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required: Missing Salary Configurations</AlertTitle>
          <AlertDescription>
            {missingEmployees.length} active employee(s) were excluded from this calculation because they lack an active salary configuration (e.g., {missingEmployees.map(e => e.name).slice(0, 3).join(", ")}).
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Employee Breakdown</h2>
        </div>
        
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No employees calculated yet. Click &quot;Calculate Run&quot; to generate the payroll snapshot.
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => {
              const hasPayslip = runPayslips.some(p => p.employeeId === item.employeeId);
              // Safely extract snapshot data
              const snapshot = item.calculationSnapshot as {
                salary?: { payFrequency?: string, workingDaysPerPeriod?: number },
                calculations?: Record<string, string>
              };
              
              // Determine warnings for this item
              const warnings = [];
              if (item.absentDays && item.absentDays !== "0" && item.absentDays !== "0.00") warnings.push(`${item.absentDays} day(s) absent`);
              if (item.unpaidLeaveDays && item.unpaidLeaveDays !== "0" && item.unpaidLeaveDays !== "0.00") warnings.push(`${item.unpaidLeaveDays} day(s) unpaid leave`);
              if (item.overtimeHours && item.overtimeHours !== "0" && item.overtimeHours.length > 2 && item.overtimeHours > "20") warnings.push(`High overtime: ${item.overtimeHours}h`);
              if (item.netPay === "-0.00" || (typeof item.netPay === 'string' && item.netPay.startsWith("-"))) warnings.push(`Negative net pay calculated`);

              return (
                <details key={item.id} className="group p-4 hover:bg-gray-50 transition-colors">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div className="flex items-center space-x-6 w-1/3">
                      <ChevronDown className="h-5 w-5 text-gray-400 group-open:-rotate-180 transition-transform" />
                      <div>
                        <p className="font-semibold">{item.employee.name}</p>
                        <p className="text-xs text-muted-foreground">{item.employee.employeeCode}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-4 gap-4 text-right pr-8">
                      <div>
                        <p className="text-xs text-muted-foreground">Basic</p>
                        <p className="font-medium">${item.basicSalary}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gross</p>
                        <p className="font-medium text-green-700">${item.grossPay}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deductions</p>
                        <p className="font-medium text-red-700">${item.deductionAmount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className="font-bold">${item.netPay}</p>
                      </div>
                    </div>

                    <div className="w-32 flex justify-end">
                      {hasPayslip ? (
                        <Link href={`/dashboard/payroll/payslips/${item.employeeId}?runId=${run.id}`} className="flex items-center text-primary hover:underline text-sm font-medium">
                          <FileText className="h-4 w-4 mr-1" /> Payslip
                        </Link>
                      ) : (
                        warnings.length > 0 ? (
                          <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" /> {warnings.length} Notice(s)
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 rounded-full">Clear</span>
                        )
                      )}
                    </div>
                  </summary>

                  <div className="mt-6 ml-11 grid grid-cols-3 gap-8 pb-4 text-sm">
                    {/* Salary Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">Salary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-500">Basic</span><span className="font-medium">${item.basicSalary}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Pay Frequency</span><span>{snapshot?.salary?.payFrequency || "monthly"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Working Days</span><span>{snapshot?.salary?.workingDaysPerPeriod || 0}</span></div>
                      </div>
                    </div>

                    {/* Attendance Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">Attendance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-500">Present</span><span>{item.presentDays}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Absent</span><span className={item.absentDays !== "0" ? "text-amber-600 font-medium" : ""}>{item.absentDays}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Paid Leave</span><span>{item.paidLeaveDays}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Unpaid Leave</span><span className={item.unpaidLeaveDays !== "0" ? "text-red-600" : ""}>{item.unpaidLeaveDays}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Overtime</span><span>{item.overtimeHours}h</span></div>
                      </div>
                    </div>

                    {/* Earnings & Deductions Section */}
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <div className="space-y-2 text-sm bg-white p-3 rounded border">
                        <div className="font-semibold border-b pb-1 text-gray-800">Earnings</div>
                        <div className="flex justify-between"><span className="text-gray-500">Basic Salary</span><span>${item.basicSalary}</span></div>
                        {(item.overtimeAmount !== "0" && item.overtimeAmount !== "0.00") && <div className="flex justify-between"><span className="text-gray-500">Overtime</span><span>${item.overtimeAmount}</span></div>}
                        {(item.allowanceAmount !== "0" && item.allowanceAmount !== "0.00") && <div className="flex justify-between"><span className="text-gray-500">Allowances</span><span>${item.allowanceAmount}</span></div>}
                        <div className="flex justify-between font-medium mt-1 pt-1 border-t"><span className="text-gray-700">Gross</span><span>${item.grossPay}</span></div>
                      </div>
                      
                      <div className="space-y-2 text-sm bg-white p-3 rounded border mt-3">
                        <div className="font-semibold border-b pb-1 text-gray-800">Deductions</div>
                        {(item.unpaidAbsenceAmount !== "0" && item.unpaidAbsenceAmount !== "0.00") && <div className="flex justify-between"><span className="text-gray-500">Unpaid Absence</span><span className="text-red-600">-${item.unpaidAbsenceAmount}</span></div>}
                        {(item.deductionAmount !== "0" && item.deductionAmount !== "0.00") && <div className="flex justify-between"><span className="text-gray-500">Other Deductions</span><span className="text-red-600">-${item.deductionAmount}</span></div>}
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t text-base mt-2">
                        <span>Net Pay</span><span>${item.netPay}</span>
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
