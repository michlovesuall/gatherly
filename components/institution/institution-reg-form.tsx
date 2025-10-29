"use client";

import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import type { InstitutionRegistrationData } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function InstitutionRegistrationForm({
  onSuccessLogin,
}: {
  onSuccessLogin?: () => void;
}) {
  const [passwordError, setPasswordError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSuccess, setDialogSuccess] = useState<boolean | null>(null);
  const [dialogMessage, setDialogMessage] = useState<string>("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InstitutionRegistrationData>();

  const onSubmit = async (data: InstitutionRegistrationData) => {
    if (data.institutionPassword !== data.institutionConfirmPassword) {
      setPasswordError("Password do not match. Please Try again");
      return;
    }

    const payload = {
      name: data.name,
      idNumber: data.idNumber || null,
      password: data.institutionPassword,
      email: data.email || null,
      phone: data.phone || null,
      avatarUrl: null,
      webDomain: data.webDomain || null,
      contactPersonEmail: data.contactPersonEmail,
    };

    try {
      const res = await fetch("/api/institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setDialogSuccess(false);
        setDialogMessage(json?.error || `Registration failed (${res.status})`);
        setDialogOpen(true);
        return;
      }

      setPasswordError("");
      setDialogSuccess(true);
      setDialogMessage("Institution registered successfully.");
      setDialogOpen(true);
      reset();
      onSuccessLogin?.();
    } catch (e) {
      setDialogSuccess(false);
      setDialogMessage(e instanceof Error ? e.message : String(e));
      setDialogOpen(true);
    }
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
            <Label htmlFor="name">
              Name<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            {/* Name. Example: Partido State University */}
            <Input
              id="name"
              type="text"
              placeholder="Partido State University"
              required
              {...register("name", {
                required: "Name is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.name && <span>{errors.name.message}</span>}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="idNumber">
              School ID<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="idNumber"
              type="text"
              placeholder="Ex. SCHOOL-ID-12345"
              required
              {...register("idNumber", { required: "School ID is required." })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="institutionEmail">
              Email<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            {/* Institution Email. Example: parsu@edu.ph */}
            <Input
              id="email"
              type="email"
              placeholder="parsu@example.com"
              required
              {...register("email", {
                required: "Email is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.email && <span>{errors.email.message}</span>}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">
              Phone<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="phone"
              type="text"
              placeholder="09xx-xxx-xxxx"
              required
              {...register("phone", { required: "Phone number is required." })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="webDomain">Website</Label>
            {/* Web Domain. Example: parsu.edu.ph */}
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
            {/* Contact Person Email. Example: johndoe@gmail.com -> will be contacted if clients have concern about the institution */}
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
            {/* Institution Password -> will be hashed. */}
            <Input
              id="institutionPassword"
              type="password"
              required
              {...register("institutionPassword", {
                required: "Password is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.institutionPassword ? (
                <span>{errors.institutionPassword.message}</span>
              ) : (
                passwordError
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="institutionConfirmPassword">
              Confirm Password<span className="text-red-600 m-0 p-0">*</span>
            </Label>
            {/* Password Confirmation. Checks if the entered is correct. */}
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
            {isSubmitting ? (
              <span className="flex gap-2">
                <Spinner /> Submitting...
              </span>
            ) : (
              "Register as Institution"
            )}
          </Button>
        </div>
      </form>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogSuccess
                ? "Registration Successful"
                : "Registration Failed"}
            </DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogSuccess ? (
              <Button
                className="cursor-pointer"
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  router.push("/");
                  router.refresh();
                }}
              >
                Back to Login
              </Button>
            ) : (
              <Button
                className="cursor-pointer"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                Re-enter Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
