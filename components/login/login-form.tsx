"use client";

// UI Imports
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";

// Utilities
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFields = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginFields>();

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (values: LoginFields) => {
    setServerError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json()
        : { ok: false, error: await res.text() };

      if (!res.ok || !data?.ok) {
        setServerError(data?.error || `Login failed (${res.status})`);
        return;
      }

      // Redirect based on user role
      const role = data.user?.platformRole || data.role;
      if (role === "institution") {
        router.push("/dashboard");
      } else if (role === "student") {
        router.push("/dashboard/student");
      } else if (role === "employee" || role === "staff") {
        router.push("/dashboard/employee");
      } else if (role === "super_admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <TabsContent value="login">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <p className="text-sm text-red-600 text-center">{serverError}</p>
          )}
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                {...register("email", { required: "Email is required" })}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                {...register("password", { required: "Password is missing" })}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </CardContent>
    </TabsContent>
  );
}
