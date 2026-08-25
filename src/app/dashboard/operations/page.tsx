import { OperationsClient } from "./operations-client";
import { getSession } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Operations Hub | Aura",
};

export default async function OperationsPage() {
  const session = await getSession();
  
  if (!session || PermissionService.cannot(session, "attendance.read")) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto">
      <OperationsClient />
    </div>
  );
}
