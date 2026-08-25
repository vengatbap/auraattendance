import { getSession, requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { payslips, organizations } from "@/db/schema";
import PrintButton from "./PrintButton";

export default async function PayslipPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ runId: string }>;
}) {
  const session = await requireTenantContext();
  if (PermissionService.cannot(session, "payroll.payslip.read")) {
    redirect("/dashboard");
  }

  const { employeeId } = await params;
  const { runId } = await searchParams;

  if (!runId) {
    return <div className="p-6">Run ID is required</div>;
  }

  const payslip = await db.query.payslips.findFirst({
    where: and(
      eq(payslips.payrollRunId, runId),
      eq(payslips.employeeId, employeeId),
      eq(payslips.organizationId, session.organizationId)
    ),
    with: {
      employee: true,
      item: true,
    }
  });

  if (!payslip) {
    return <div className="p-6">Payslip not found</div>;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.organizationId!)
  });

  const snapshot = payslip.item.calculationSnapshot as {
    salary?: { payFrequency?: string, workingDaysPerPeriod?: number },
    calculations?: Record<string, string>
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Payslip</h1>
        <PrintButton />
      </div>

      <div className="bg-white p-8 border rounded-lg shadow-sm print:shadow-none print:border-none print:p-0 text-sm text-gray-800" id="payslip-content">
        <div className="border-b pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold uppercase text-gray-900">{org?.companyName || org?.name || "Company Name"}</h2>
              <p className="text-gray-500 mt-1">Payslip for Period: {payslip.periodStart} to {payslip.periodEnd}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-700">Payslip No: {payslip.payslipNumber}</p>
              <p className="text-gray-500">Issued On: {payslip.issuedAt ? new Date(payslip.issuedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Employee Details</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Name</td>
                  <td className="py-1 font-medium">{payslip.employee.name}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Employee ID</td>
                  <td className="py-1 font-medium">{payslip.employee.employeeCode}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Department</td>
                  <td className="py-1 font-medium">{payslip.employee.department || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Designation</td>
                  <td className="py-1 font-medium">{payslip.employee.designation || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Attendance Summary</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Present Days</td>
                  <td className="py-1 font-medium">{snapshot?.calculations?.presentDays || 0}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Paid Leave</td>
                  <td className="py-1 font-medium">{snapshot?.calculations?.paidLeaveDays || 0}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Unpaid Leave</td>
                  <td className="py-1 font-medium">{snapshot?.calculations?.unpaidLeaveDays || 0}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Absent Days</td>
                  <td className="py-1 font-medium">{snapshot?.calculations?.absentDays || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3 bg-gray-50 p-2">Earnings</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-600">Basic Salary</td>
                  <td className="py-2 text-right font-medium">{payslip.currency} {snapshot?.calculations?.basicSalary || 0}</td>
                </tr>
                {(snapshot?.calculations?.allowanceAmount && snapshot.calculations.allowanceAmount !== "0" && snapshot.calculations.allowanceAmount !== "0.00") && (
                  <tr>
                    <td className="py-2 text-gray-600">Allowances</td>
                    <td className="py-2 text-right font-medium">{payslip.currency} {snapshot?.calculations?.allowanceAmount}</td>
                  </tr>
                )}
                {(snapshot?.calculations?.overtimeAmount && snapshot.calculations.overtimeAmount !== "0" && snapshot.calculations.overtimeAmount !== "0.00") && (
                  <tr>
                    <td className="py-2 text-gray-600">Overtime ({snapshot?.calculations?.overtimeHours || 0} hrs)</td>
                    <td className="py-2 text-right font-medium">{payslip.currency} {snapshot?.calculations?.overtimeAmount}</td>
                  </tr>
                )}
                <tr className="border-t">
                  <td className="py-2 font-semibold text-gray-900">Gross Earnings</td>
                  <td className="py-2 text-right font-bold">{payslip.currency} {payslip.grossPay}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3 bg-gray-50 p-2">Deductions</h3>
            <table className="w-full">
              <tbody>
                {(snapshot?.calculations?.deductionAmount && snapshot.calculations.deductionAmount !== "0" && snapshot.calculations.deductionAmount !== "0.00") && (
                  <tr>
                    <td className="py-2 text-gray-600">Standard Deductions</td>
                    <td className="py-2 text-right font-medium">{payslip.currency} {snapshot?.calculations?.deductionAmount}</td>
                  </tr>
                )}
                {(snapshot?.calculations?.unpaidAbsenceAmount && snapshot.calculations.unpaidAbsenceAmount !== "0" && snapshot.calculations.unpaidAbsenceAmount !== "0.00") && (
                  <tr>
                    <td className="py-2 text-gray-600">Unpaid Absences</td>
                    <td className="py-2 text-right font-medium">{payslip.currency} {snapshot?.calculations?.unpaidAbsenceAmount}</td>
                  </tr>
                )}
                <tr className="border-t">
                  <td className="py-2 font-semibold text-gray-900">Total Deductions</td>
                  <td className="py-2 text-right font-bold">{payslip.currency} {payslip.totalDeductions}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-gray-800 pt-4 pb-4 bg-gray-50 px-4 rounded">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Net Pay</h3>
            <span className="text-xl font-black text-blue-700">{payslip.currency} {payslip.netPay}</span>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t flex justify-between text-gray-500 text-xs">
          <div>
            <p>This is a computer-generated document. No signature is required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
