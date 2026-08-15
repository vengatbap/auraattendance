import { LeaveBalanceRepository } from "../repository/leave-balance.repository";

export class LeaveBalanceService {
  static async getEmployeeBalances(organizationId: string, employeeId: string, year: number) {
    const balances = await LeaveBalanceRepository.listByEmployee(organizationId, employeeId, year);
    
    // Add computed "available" balance to the response
    return balances.map(b => ({
      ...b,
      available: b.balance.allocatedDays + b.type.maxCarryForward - b.balance.usedDays - b.balance.pendingDays
    }));
  }
}
