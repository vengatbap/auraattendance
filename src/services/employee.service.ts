import { employeeRepository } from "@/repositories/employee.repository";
import { faceRepository } from "@/repositories/face.repository";
import { matchEmbedding } from "@/utils";
import type { EmployeeStatus } from "@/types";
import { employees } from "@/db/schema";

export const employeeService = {
  async list(params?: { search?: string; status?: EmployeeStatus; page?: number; pageSize?: number }) {
    return employeeRepository.findAll(params);
  },

  async getById(id: string) {
    const emp = await employeeRepository.findById(id);
    if (!emp) throw new Error("Employee not found");
    return emp;
  },

  async create(data: {
    employeeCode: string;
    governmentId: string;
    name: string;
    department?: string;
    designation?: string;
    phone?: string;
    email?: string;
    status?: EmployeeStatus;
    enrollmentPhoto?: string;
  }) {
    const existing = await employeeRepository.findByEmployeeCode(data.employeeCode);
    if (existing) throw new Error("Employee code already exists");
    return employeeRepository.create(data as unknown as typeof employees.$inferInsert);
  },

  async update(id: string, data: Partial<{
    name: string; department: string; designation: string;
    phone: string; email: string; status: EmployeeStatus; enrollmentPhoto: string;
  }>) {
    await this.getById(id); // ensure exists
    return employeeRepository.update(id, data as unknown as Partial<typeof employees.$inferInsert>);
  },

  async delete(id: string) {
    await this.getById(id);
    await employeeRepository.delete(id);
  },

  async recognizeFace(queryEmbedding: number[]) {
    const profiles = await faceRepository.getAllEmbeddings();
    const mapped = profiles.map((p) => ({
      employeeId: p.employeeId,
      embedding: p.embedding as number[],
    }));
    const match = matchEmbedding(queryEmbedding, mapped);
    if (!match) return null;
    const employee = await employeeRepository.findById(match.employeeId);
    return { employee, score: match.score };
  },
};
