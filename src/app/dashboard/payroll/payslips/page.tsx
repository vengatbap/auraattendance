import { getSession, requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { payslips } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PayslipsOverviewPage() {
  const session = await requireTenantContext();
  if (PermissionService.cannot(session, "payroll.payslip.read")) {
    redirect("/dashboard");
  }

  const allPayslips = await db.query.payslips.findMany({
    where: eq(payslips.organizationId, session.organizationId),
    with: {
      employee: true,
      run: {
        with: {
          period: true,
        }
      }
    },
    orderBy: (payslips, { desc }) => [desc(payslips.periodEnd)]
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payslips Register</h1>
          <p className="text-muted-foreground mt-1">
            Archive of all generated payslips for the organization.
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allPayslips.map((payslip) => (
              <tr key={payslip.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payslip.payslipNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-semibold">{payslip.employee?.name}</p>
                    <p className="text-xs text-muted-foreground">{payslip.employee?.employeeCode}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm">{payslip.run?.period?.name}</p>
                  <p className="text-xs text-muted-foreground">{payslip.periodStart} to {payslip.periodEnd}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  ${payslip.grossPay}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-sm">
                  ${payslip.netPay}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link href={`/dashboard/payroll/payslips/${payslip.employeeId}?runId=${payslip.payrollRunId}`}>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
                      <Printer className="h-4 w-4 mr-2" /> View / Print
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {allPayslips.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  No payslips have been generated yet. Payslips are created when a payroll run is LOCKED.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
