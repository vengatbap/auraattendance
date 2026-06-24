import { faceRepository } from "@/repositories/face.repository";
import { employeeRepository } from "@/repositories/employee.repository";

export const faceService = {
  async enroll(employeeId: string, embedding: number[], enrollmentPhoto?: string) {
    const emp = await employeeRepository.findById(employeeId);
    if (!emp) throw new Error("Employee not found");
    await faceRepository.upsert(employeeId, embedding);
    if (enrollmentPhoto) {
      await employeeRepository.update(employeeId, { enrollmentPhoto } as any);
    }
    return { success: true };
  },

  async getByEmployee(employeeId: string) {
    return faceRepository.findByEmployee(employeeId);
  },

  async delete(employeeId: string) {
    await faceRepository.delete(employeeId);
    await employeeRepository.update(employeeId, { enrollmentPhoto: null } as any);
    return { success: true };
  },
};
