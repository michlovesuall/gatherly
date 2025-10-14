import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import type { InstitutionRegistrationData } from "@/lib/types";


export default function InstitutionRegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InstitutionRegistrationData>();

  const onSubmit = async (data: InstitutionRegistrationData) => {
    if (data.institutionPassword !== data.institutionConfirmPassword) {
      alert("Password do not match");
      return;
    }
    const now = new Date().toISOString();
    const res = await fetch("/api/register/institution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        institutionName: data.institutionName,
        hashedPassword: data.institutionPassword,
        emailDomain: data.institutionEmail,
        status: "pending",
        created_at: now,
        updated_at: now,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Registration error.");
      return;
    }
    reset();
    alert("Institution registered.");
  };

  return (
    <div className="space-y-3">
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">
          Register as Institution
        </h4>
        <p className="text-sm text-green-700">
          Create an institutional account to manage events, organize activities,
          and connect with your campus community.
        </p>
      </div>
      <h3 className="text-lg text-center md:text-left font-semibold">
        Institution Registration
      </h3>
      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="institutionName">
              Institution Name<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="institutionName"
              type="text"
              placeholder="Partido State University"
              required
              {...register("institutionName", {
                required: "Institution name is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.institutionName && (
                <span>{errors.institutionName.message}</span>
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="institutionEmail">
              Email<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="institutionEmail"
              type="email"
              placeholder="parsu@example.com"
              required
              {...register("institutionEmail", {
                required: "Email is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.institutionEmail && (
                <span>{errors.institutionEmail.message}</span>
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="webDomain">Website</Label>
            <Input
              id="webDomain"
              type="text"
              placeholder="parsu.edu.ph"
              {...register("webDomain")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contactPersonEmail">
              Contact Person&apos;s Email
              <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="contactPersonEmail"
              type="email"
              placeholder="janesmith@example.com"
              required
              {...register("contactPersonEmail", {
                required: "Contact Person Email is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.contactPersonEmail && (
                <span>{errors.contactPersonEmail.message}</span>
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="institutionPassword">
              Password<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="institutionPassword"
              type="password"
              required
              {...register("institutionPassword", {
                required: "Password is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.institutionPassword && (
                <span>{errors.institutionPassword.message}</span>
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="institutionConfirmPassword">
              Confirm Password<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="institutionConfirmPassword"
              type="password"
              required
              {...register("institutionConfirmPassword", {
                required: "Confirm password is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.institutionConfirmPassword && (
                <span>{errors.institutionConfirmPassword.message}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Register as Institution"}
          </Button>
        </div>
      </form>
    </div>
  );
}
