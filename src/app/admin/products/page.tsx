"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Edit, Save, X } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  employeesLimit: number;
  sitesLimit: number;
  features: string[];
}

const initialPlans: PricingPlan[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: 0,
    employeesLimit: 5,
    sitesLimit: 1,
    features: ["GPS Location punches", "Local face matching", "14-day logs history", "Browser kiosk mode"],
  },
  {
    id: "standard",
    name: "Standard Plan",
    price: 49,
    employeesLimit: 100,
    sitesLimit: 5,
    features: ["GPS Location punches", "Local face matching", "Unlimited logs history", "Excel & PDF reports", "Multiple kiosk profiles"],
  },
  {
    id: "enterprise",
    name: "Enterprise Tier",
    price: 199,
    employeesLimit: 10000,
    sitesLimit: 100,
    features: ["GPS Location punches", "Local face matching", "Unlimited logs history", "Excel & PDF reports", "Dedicated support", "Advanced API integrations"],
  },
];

export default function AdminProductsPage() {
  const [plans, setPlans] = useState<PricingPlan[]>(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPlan, setEditedPlan] = useState<PricingPlan | null>(null);

  function startEditing(plan: PricingPlan) {
    setEditingId(plan.id);
    setEditedPlan({ ...plan });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditedPlan(null);
  }

  function handleSave() {
    if (!editedPlan) return;
    setPlans(plans.map((p) => (p.id === editedPlan.id ? editedPlan : p)));
    setEditingId(null);
    setEditedPlan(null);
    toast.success("Product package parameters updated successfully");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Products & Plans</h1>
        <p className="text-zinc-500 mt-1 text-sm">Configure system-wide subscription pricing plans, employee limits, and site limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;
          return (
            <Card key={plan.id} className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-zinc-900/60 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold text-white">{plan.name}</CardTitle>
                    <span className="text-[9px] font-black uppercase bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                      ID: {plan.id}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-zinc-500">Plan constraints and configuration parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 py-6">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Monthly Price (USD)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedPlan?.price}
                        onChange={(e) => setEditedPlan({ ...editedPlan!, price: Number(e.target.value) })}
                        className="bg-zinc-950 border-zinc-900 text-white"
                      />
                    ) : (
                      <div className="text-2xl font-black text-white">${plan.price}<span className="text-xs text-zinc-500 font-semibold"> /month</span></div>
                    )}
                  </div>

                  {/* Staff Limit */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Max Employees Limit</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedPlan?.employeesLimit}
                        onChange={(e) => setEditedPlan({ ...editedPlan!, employeesLimit: Number(e.target.value) })}
                        className="bg-zinc-950 border-zinc-900 text-white"
                      />
                    ) : (
                      <div className="text-sm font-bold text-zinc-300">
                        {plan.employeesLimit >= 10000 ? "Unlimited" : `${plan.employeesLimit} Employees`}
                      </div>
                    )}
                  </div>

                  {/* Site Limit */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Max Location Sites Limit</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedPlan?.sitesLimit}
                        onChange={(e) => setEditedPlan({ ...editedPlan!, sitesLimit: Number(e.target.value) })}
                        className="bg-zinc-950 border-zinc-900 text-white"
                      />
                    ) : (
                      <div className="text-sm font-bold text-zinc-300">
                        {plan.sitesLimit >= 100 ? "Unlimited" : `${plan.sitesLimit} Sites`}
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 border-t border-zinc-900 pt-4">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Included Features</Label>
                    <ul className="space-y-2">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-zinc-400">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="border-t border-zinc-900/60 pt-4 flex justify-end gap-2 bg-zinc-950/20">
                {isEditing ? (
                  <>
                    <Button
                      onClick={cancelEditing}
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-white h-8 cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 cursor-pointer font-bold"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => startEditing(plan)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-300 hover:text-white h-8 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    Configure Plan
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
