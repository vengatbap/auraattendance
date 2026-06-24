"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useForm as useRHForm } from "react-hook-form";
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
import { LogIn } from "lucide-react";
import { toast } from "sonner"; // Since we use sonner

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useRHForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to login");
      } else {
        toast.success("Logged in successfully");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl z-10 text-slate-100">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30">
              <LogIn className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center tracking-tight">Admin Login</CardTitle>
          <CardDescription className="text-center text-slate-400 text-base">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@company.com" 
                        {...field} 
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-slate-500 z-10 text-center max-w-[250px]">
        Protected by enterprise-grade security. Authorized personnel only.
      </p>
    </div>
  );
}
