import { AdminForm } from "@/components/dashboard/admin-form";

export default function NewAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Administrator</h1>
        <p className="text-slate-400 mt-2">Add a new system administrator account</p>
      </div>
      <AdminForm />
    </div>
  );
}
