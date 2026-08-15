import { getSession } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { payrollRuns, payrollItems, payslips } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import RunDetailsClient from "./RunDetailsClient";
import Link from "next/link";

export default async function RunDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || PermissionService.cannot(session, "payroll.read")) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const run = await db.query.payrollRuns.findFirst({
    where: and(
      eq(payrollRuns.id, id),
      eq(payrollRuns.organizationId, session.organizationId!)
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
      eq(payrollItems.organizationId, session.organizationId!)
    ),
    with: {
      employee: true,
    }
  });

  const runPayslips = await db.query.payslips.findMany({
    where: and(
      eq(payslips.payrollRunId, id),
      eq(payslips.organizationId, session.organizationId!)
    )
  });

  const displayStatus = run.status === "PAID" ? "LOCKED" : run.status;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pay Run Details</h1>
          <p className="text-gray-600">{run.period.name} ({run.period.periodStart} to {run.period.periodEnd})</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold">{displayStatus}</span>
        </div>
      </div>

      <RunDetailsClient runId={run.id} status={run.status} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 shadow rounded text-center">
          <p className="text-sm text-gray-500">Employees</p>
          <p className="text-xl font-bold">{run.employeeCount}</p>
        </div>
        <div className="bg-white p-4 shadow rounded text-center">
          <p className="text-sm text-gray-500">Gross Total</p>
          <p className="text-xl font-bold">{run.grossTotal}</p>
        </div>
        <div className="bg-white p-4 shadow rounded text-center">
          <p className="text-sm text-gray-500">Deductions</p>
          <p className="text-xl font-bold">{run.deductionTotal}</p>
        </div>
        <div className="bg-white p-4 shadow rounded text-center">
          <p className="text-sm text-gray-500">Net Total</p>
          <p className="text-xl font-bold">{run.netTotal}</p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const hasPayslip = runPayslips.some(p => p.employeeId === item.employeeId);
              return (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.employee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{item.basicSalary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{item.grossPay}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{item.deductionAmount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">{item.netPay}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {hasPayslip ? (
                    <Link href={`/dashboard/payroll/runs/${run.id}/payslip/${item.employeeId}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      View Payslip
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm">No Payslip</span>
                  )}
                </td>
              </tr>
            )})}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No items found in this run. Click Calculate Run to generate.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
