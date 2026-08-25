import { getSession, requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PayrollRunRepository } from "@/modules/payroll/repository/payroll-run.repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle, Play, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function PayrollOverviewPage() {
  const session = await requireTenantContext();
  if (PermissionService.cannot(session, "payroll.read")) {
    redirect("/dashboard");
  }

  const latestRun = await PayrollRunRepository.findLatest(session.organizationId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Overview</h1>
          <p className="text-muted-foreground mt-1">Manage periods, calculations, and execution.</p>
        </div>
        <div className="flex space-x-3">
          {PermissionService.can(session, "payroll.create") && (
            <Link href="/dashboard/payroll/periods/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Create Period
              </Button>
            </Link>
          )}
          {latestRun && latestRun.status === "DRAFT" && PermissionService.can(session, "payroll.calculate") && (
            <Link href={`/dashboard/payroll/runs/${latestRun.id}`}>
              <Button>
                <Play className="mr-2 h-4 w-4" /> Start Run
              </Button>
            </Link>
          )}
          {latestRun && latestRun.status !== "DRAFT" && PermissionService.can(session, "payroll.read") && (
            <Link href={`/dashboard/payroll/runs/${latestRun.id}`}>
              <Button>Continue Run</Button>
            </Link>
          )}
        </div>
      </div>

      {!latestRun ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payroll runs found for this organization.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Payroll Period</CardTitle>
              <CardDescription>Details of the active execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Period Name</p>
                  <p className="text-lg font-semibold">{latestRun.period?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{latestRun.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dates</p>
                  <p className="text-md">
                    {latestRun.period?.periodStart} to {latestRun.period?.periodEnd}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employees Included</p>
                  <p className="text-lg">{latestRun.employeeCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run Totals</CardTitle>
              <CardDescription>Financial summary of the current run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Gross Payroll</span>
                <span className="font-medium">${latestRun.grossTotal || "0.00"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Deductions</span>
                <span className="font-medium">${latestRun.deductionTotal || "0.00"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Net Payroll</span>
                <span>${latestRun.netTotal || "0.00"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {latestRun?.status === "REVIEW" && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Review Required</AlertTitle>
          <AlertDescription className="text-blue-700">
            The current payroll run has finished calculating. Please review the employee breakdowns for exceptions before approving.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <Link href="/dashboard/payroll/runs" className="p-6 border rounded-lg shadow-sm hover:border-primary transition-colors">
          <h2 className="text-lg font-semibold mb-2">Pay Runs</h2>
          <p className="text-sm text-muted-foreground">Manage all past and active payroll runs.</p>
        </Link>
        <Link href="/dashboard/payroll/salary" className="p-6 border rounded-lg shadow-sm hover:border-primary transition-colors">
          <h2 className="text-lg font-semibold mb-2">Salary Settings</h2>
          <p className="text-sm text-muted-foreground">Configure employee salaries and rates.</p>
        </Link>
        <Link href="/dashboard/payroll/payslips" className="p-6 border rounded-lg shadow-sm hover:border-primary transition-colors">
          <h2 className="text-lg font-semibold mb-2">Payslips</h2>
          <p className="text-sm text-muted-foreground">Access print-friendly payslip records.</p>
        </Link>
      </div>
    </div>
  );
}
