"use client";

import { use, useEffect, useState } from "react";
import { EmployeeForm } from "@/components/dashboard/employee-form";
import { FaceRegistration } from "@/components/dashboard/face-registration";
import { toast } from "sonner";
import type { Employee as EmployeeType } from "@/types";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<EmployeeType | null>(null);
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
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  if (!employee) {
    return <div className="text-center py-12 text-red-400">Employee not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <p className="text-slate-400 mt-2">Update employee information and biometric profile</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <EmployeeForm
          initialData={{
            id: employee.id,
            employeeCode: employee.employeeCode,
            governmentId: employee.governmentId,
            name: employee.name,
            siteId: employee.siteId ?? undefined,
            departmentId: employee.departmentId ?? undefined,
            designation: employee.designation ?? undefined,
            phone: employee.phone ?? undefined,
            email: employee.email ?? undefined,
            status: employee.status,
          }}
          isEdit
        />

        <FaceRegistration 
          employeeId={employee.id} 
          employeeName={employee.name}
          employeeCode={employee.employeeCode}
        />
      </div>
    </div>
  );
}
