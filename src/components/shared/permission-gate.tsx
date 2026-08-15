import { ReactNode } from "react";
import { PermissionService, Permission } from "@/lib/rbac";
import { UserRole } from "@/modules/permissions/types";

interface PermissionGateProps {
  role: UserRole;
  action: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only if user role satisfies action permission constraints.
 */
export function PermissionGate({
  role,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const allowed = PermissionService.can({ role }, action);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
