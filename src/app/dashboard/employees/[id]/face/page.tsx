"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ScanFace, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaceRegistration } from "@/components/dashboard/face-registration";
import { toast } from "sonner";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
}

export default function EmployeeFacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`/api/employees/${id}`);
        if (!res.ok) throw new Error();
        const result = await res.json();
        if (result.success && result.data) {
          setEmployee(result.data);
        } else {
          throw new Error();
        }
      } catch {
        toast.error("Failed to load employee details");
      } finally {
        setLoading(false);
      }
    }

    void fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="size-10 animate-pulse rounded-2xl bg-blue-500/20" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center py-12 text-red-400">Employee not found</div>;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/employees">
            <Button variant="outline" size="icon" className="size-10 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-400">
              <ScanFace className="size-4" />
              Biometric enrollment
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Register employee face</h1>
            <p className="mt-2 text-sm text-slate-400">
              Create a reliable face profile for attendance verification.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
          <ShieldCheck className="size-3.5" />
          Secure enrollment
        </div>
      </div>

      <FaceRegistration
        employeeId={employee.id}
        employeeName={employee.name}
        employeeCode={employee.employeeCode}
      />
    </div>
  );
}
