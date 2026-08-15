import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { leaveTypes, leaveBalances, leaveRequests } from "@/db/schema";

export type LeaveType = InferSelectModel<typeof leaveTypes>;
export type NewLeaveType = InferInsertModel<typeof leaveTypes>;

export type LeaveBalance = InferSelectModel<typeof leaveBalances>;
export type NewLeaveBalance = InferInsertModel<typeof leaveBalances>;

export type LeaveRequest = InferSelectModel<typeof leaveRequests>;
export type NewLeaveRequest = InferInsertModel<typeof leaveRequests>;

export type LeaveRequestStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeavePayrollSummary {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  approvedLeaveDays: number;
}
