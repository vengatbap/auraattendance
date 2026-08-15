import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeaveRequestRepository } from "@/modules/leave/repository/leave-request.repository";
import { LeaveBalanceRepository } from "@/modules/leave/repository/leave-balance.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PendingLeaveActions } from "./pending-leave-actions";

export default async function LeaveOverviewPage() {
  const session = await getSession();
  if (!session?.organizationId) redirect("/login");
  const orgId = session.organizationId;
  const currentYear = new Date().getFullYear();

  // 1. Pending Requests
  const pendingRequests = await LeaveRequestRepository.list(orgId, { status: "PENDING" });
  
  // 2. Employee balances
  const balances = await LeaveBalanceRepository.listAll(orgId, currentYear);
  
  // 3. Recent resolved requests (Approved/Rejected)
  const allRequests = await LeaveRequestRepository.list(orgId);
  const recentResolved = allRequests.filter(r => r.request.status === "APPROVED" || r.request.status === "REJECTED").slice(0, 10);

  const pendingWithBalances = pendingRequests.map(r => {
    const bal = balances.find(b => b.employee.id === r.employee.id && b.type.id === r.type.id);
    const balanceRemaining = bal ? (bal.balance.allocatedDays + bal.type.maxCarryForward - bal.balance.usedDays) : 0;
    return { ...r, balanceRemaining };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Leave Management</h1>
        <p className="text-zinc-500 mt-1 text-sm">Review and manage employee leave requests.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Pending Requests</h2>
        {pendingWithBalances.length === 0 ? (
          <Card className="bg-[#121214] border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-500">
              No pending leave requests.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingWithBalances.map(item => (
              <Card key={item.request.id} className="bg-[#121214] border-zinc-800 flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base text-zinc-200">{item.employee.name}</CardTitle>
                      <p className="text-xs text-zinc-500">{item.type.name}</p>
                    </div>
                    <Badge variant={item.type.isPaid ? "default" : "secondary"}>
                      {item.type.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="text-sm text-zinc-400 space-y-1 mb-2 flex-1">
                    <p>Dates: <span className="text-zinc-200">{item.request.startDate} to {item.request.endDate}</span></p>
                    <p>Days: <span className="text-zinc-200">{item.request.requestedDays}</span></p>
                    <p>Remaining Balance: <span className="text-zinc-200">{item.balanceRemaining}</span></p>
                  </div>
                  <PendingLeaveActions requestId={item.request.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Employee Balances</h2>
        <Card className="bg-[#121214] border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Employee</TableHead>
                <TableHead className="text-zinc-400">Leave Type</TableHead>
                <TableHead className="text-right text-zinc-400">Allocated</TableHead>
                <TableHead className="text-right text-zinc-400">Used</TableHead>
                <TableHead className="text-right text-zinc-400">Pending</TableHead>
                <TableHead className="text-right text-zinc-400">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                    No balances found.
                  </TableCell>
                </TableRow>
              ) : (
                balances.map(b => {
                  const available = b.balance.allocatedDays + b.type.maxCarryForward - b.balance.usedDays - b.balance.pendingDays;
                  return (
                    <TableRow key={b.balance.id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                      <TableCell className="font-medium text-zinc-200">{b.employee.name}</TableCell>
                      <TableCell className="text-zinc-400">{b.type.name}</TableCell>
                      <TableCell className="text-right text-zinc-300">{b.balance.allocatedDays}</TableCell>
                      <TableCell className="text-right text-zinc-300">{b.balance.usedDays}</TableCell>
                      <TableCell className="text-right text-zinc-300">{b.balance.pendingDays}</TableCell>
                      <TableCell className="text-right font-bold text-zinc-200">{available}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recent Resolved Requests</h2>
        <Card className="bg-[#121214] border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Employee</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Dates</TableHead>
                <TableHead className="text-zinc-400">Days</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentResolved.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                    No recent resolved requests.
                  </TableCell>
                </TableRow>
              ) : (
                recentResolved.map(item => (
                  <TableRow key={item.request.id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-medium text-zinc-200">{item.employee.name}</TableCell>
                    <TableCell className="text-zinc-400">{item.type.name}</TableCell>
                    <TableCell className="text-zinc-400">{item.request.startDate} to {item.request.endDate}</TableCell>
                    <TableCell className="text-zinc-300">{item.request.requestedDays}</TableCell>
                    <TableCell>
                      <Badge variant={item.request.status === "APPROVED" ? "default" : "destructive"}>
                        {item.request.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
