"use client";

import { useEffect, useState } from "react";
import { AdminForm } from "@/components/dashboard/admin-form";
import type { UserRole } from "@/types";
import { toast } from "sonner";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export default function EditAdminPage({ params }: { params: { id: string } }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch(`/api/admins/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch admin");
        const data = await res.json();
        setAdmin(data);
      } catch {
        toast.error("Failed to load admin");
      } finally {
        setLoading(false);
      }
    }
    fetchAdmin();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!admin) {
    return <div className="text-center py-12 text-red-400">Admin not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Administrator</h1>
        <p className="text-slate-400 mt-2">Update administrator details</p>
      </div>
      <AdminForm initialData={admin} isEdit />
    </div>
  );
}
