"use client";

import { use, useEffect, useState } from "react";
import { SiteForm } from "@/components/dashboard/site-form";
import { toast } from "sonner";
import type { Site as SiteType } from "@/types";

export default function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [site, setSite] = useState<SiteType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSite() {
      try {
        const res = await fetch(`/api/sites/${id}`);
        if (!res.ok) throw new Error("Failed to fetch site");
        const data = await res.json();
        setSite(data);
      } catch {
        toast.error("Failed to load site");
      } finally {
        setLoading(false);
      }
    }
    fetchSite();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!site) {
    return <div className="text-center py-12 text-red-400">Site not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Site</h1>
        <p className="text-slate-400 mt-2">Update site details and coordinates</p>
      </div>
      <SiteForm initialData={site} isEdit />
    </div>
  );
}

