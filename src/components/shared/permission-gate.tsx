import { ReactNode } from "react";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { PermissionAction, UserRole } from "@/modules/permissions/types";

interface PermissionGateProps {
  role: UserRole;
  action: PermissionAction;
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
  const allowed = PermissionService.hasRolePermission(role, action);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
