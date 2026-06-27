"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Info } from "lucide-react";
import { toast } from "sonner";

const signupFormSchema = z.object({
  organizationName: z.string().min(2, "Company name must be at least 2 characters").max(255),
  organizationSlug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  ownerName: z.string().min(2, "Administrator name must be at least 2 characters").max(255),
  ownerEmail: z.string().email("Invalid email address"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupFormData = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      organizationName: "",
      organizationSlug: "",
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
    },
  });

  const watchOrgName = form.watch("organizationName");

  // Handle auto-generating link slug from company name
  const handleAutoSlug = () => {
    if (!watchOrgName) return;
    const generated = watchOrgName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    form.setValue("organizationSlug", generated, { shouldValidate: true });
  };

  async function onSubmit(values: SignupFormData) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          // Map backend field errors to react-hook-form errors
          Object.keys(result.errors).forEach((key) => {
            form.setError(key as keyof SignupFormData, {
              type: "manual",
              message: result.errors[key][0],
            });
          });
        }
        toast.error(result.message || "Signup failed");
      } else {
        toast.success("Account created successfully!");
        router.push("/onboarding");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-lg bg-slate-950/50 border-slate-900 backdrop-blur-xl shadow-2xl z-10 text-slate-100 rounded-3xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-500/20 text-blue-500">
              <UserPlus className="w-7 h-7" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold text-center tracking-tight">Create Organization</CardTitle>
          <CardDescription className="text-center text-slate-400 text-sm">
            Launch your 14-day free trial in under a minute
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Corp"
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleAutoSlug();
                          }}
                          className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center justify-between">
                        Link Slug
                        {watchOrgName && (
                          <button
                            type="button"
                            onClick={handleAutoSlug}
                            className="text-[10px] text-blue-500 underline"
                          >
                            Auto-fill
                          </button>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="acme-corp"
                            {...field}
                            className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700 pr-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex items-start gap-3">
                <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Your portal will be available at: <code className="text-slate-200">/dashboard</code>. The link slug must be lowercase and URL-safe.
                </p>
              </div>

              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Super Admin Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@company.com"
                        {...field}
                        className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-xl transition shadow-lg mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Provisioning SaaS Account..." : "Create Organization"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-slate-500 z-10 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
