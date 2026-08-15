import { Permission } from "@/lib/rbac";
export type UserRole = "super_admin" | "admin" | "manager" | "viewer";
export type PermissionAction = Permission;
