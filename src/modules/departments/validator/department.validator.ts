import { z } from "zod";

export const departmentCreateSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").max(255),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const departmentUpdateSchema = departmentCreateSchema.partial();

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
