import { getSession } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PayrollOverviewPage() {
  const session = await getSession();
  if (!session || PermissionService.cannot(session, "payroll.read")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payroll Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/payroll/runs" className="p-6 border rounded shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Pay Runs</h2>
          <p className="text-gray-600">Manage payroll periods and runs.</p>
        </Link>
        <Link href="/dashboard/payroll/salary" className="p-6 border rounded shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Salary Settings</h2>
          <p className="text-gray-600">Configure employee salaries.</p>
        </Link>
        <Link href="/dashboard/payroll/payslips" className="p-6 border rounded shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Payslips</h2>
          <p className="text-gray-600">View generated payslips.</p>
        </Link>
      </div>
    </div>
  );
}
