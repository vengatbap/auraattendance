import { getSession } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { payrollPeriods } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function PayRunsPage() {
  const session = await getSession();
  if (!session || PermissionService.cannot(session, "payroll.read")) {
    redirect("/dashboard");
  }

  const periods = await db.query.payrollPeriods.findMany({
    where: eq(payrollPeriods.organizationId, session.organizationId!),
    orderBy: [desc(payrollPeriods.periodStart)],
    with: {
      runs: true,
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payroll Runs</h1>
      </div>
      
      <div className="bg-white shadow rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periods.map((period) => (
              <tr key={period.id}>
                <td className="px-6 py-4 whitespace-nowrap">{period.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{period.periodStart} - {period.periodEnd}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {period.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {period.runs && period.runs.length > 0 ? (
                    <Link href={`/dashboard/payroll/runs/${period.runs[0].id}`} className="text-indigo-600 hover:text-indigo-900">
                      View Run
                    </Link>
                  ) : (
                    <span className="text-gray-400">No Run</span>
                  )}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No periods found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
