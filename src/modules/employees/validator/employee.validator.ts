import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee Code is required").max(100),
  governmentId: z.string().min(1, "Government ID is required").max(100),
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  siteId: z.string().uuid("Invalid site ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  designation: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email("Invalid email address").max(255).optional().nullable(),
  status: z.enum(["active", "inactive", "suspended", "resigned"]).default("active"),
  enrollmentPhoto: z.string().optional().nullable(),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee Code is required").max(100).optional(),
  governmentId: z.string().min(1, "Government ID is required").max(100).optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(255).optional(),
  siteId: z.string().uuid("Invalid site ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  designation: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email("Invalid email address").max(255).optional().nullable(),
  status: z.enum(["active", "inactive", "suspended", "resigned"]).optional(),
  enrollmentPhoto: z.string().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
