import { SiteForm } from "@/components/dashboard/site-form";

export default function NewSitePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Site</h1>
        <p className="text-slate-400 mt-2">Add a new company location with GPS coordinates</p>
      </div>
      <SiteForm />
    </div>
  );
}
