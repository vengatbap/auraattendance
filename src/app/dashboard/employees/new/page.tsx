import { EmployeeForm } from "@/components/dashboard/employee-form";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enroll Employee</h1>
        <p className="text-slate-400 mt-2">Add a new employee to the system</p>
      </div>
      <EmployeeForm />
    </div>
  );
}
