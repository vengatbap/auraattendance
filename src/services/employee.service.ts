import { employeeRepository } from "@/repositories/employee.repository";
import { faceRepository } from "@/repositories/face.repository";
import { matchEmbedding } from "@/utils";
import type { EmployeeStatus } from "@/types";

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
    employeeNumber: string;
    cpr: string;
    name: string;
    department?: string;
    designation?: string;
    phone?: string;
    email?: string;
    status?: EmployeeStatus;
    enrollmentPhoto?: string;
  }) {
    const existing = await employeeRepository.findByEmployeeNumber(data.employeeNumber);
    if (existing) throw new Error("Employee number already exists");
    return employeeRepository.create(data as any);
  },

  async update(id: string, data: Partial<{
    name: string; department: string; designation: string;
    phone: string; email: string; status: EmployeeStatus; enrollmentPhoto: string;
  }>) {
    await this.getById(id); // ensure exists
    return employeeRepository.update(id, data as any);
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
