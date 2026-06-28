import { z } from "zod";
import { EMPLOYEE_STATUSES } from "@/constants";

export const employeeCreateSchema = z.object({
  employeeCode: z.string().min(1),
  governmentId: z.string().min(1),
  name: z.string().min(2),
  siteId: z.string().uuid(),
  status: z.enum(EMPLOYEE_STATUSES).default("active"),
});

export const employeeUpdateSchema = employeeCreateSchema
  .partial()
  .extend({
    siteId: z.string().uuid().nullable().optional(),
  });

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
