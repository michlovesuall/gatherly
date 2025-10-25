"use client";

// UI Imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Utility Imports
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { InstitutionOption, StudentRegistrationData } from "@/lib/types";

interface StudentFormProps {
  institutions: InstitutionOption[];
  loadingInstitutions: boolean;
  institutionError: string | null;
  institutionValue: string;
  setInstitutionValue: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function StudentRegistrationForm({
  institutions,
  loadingInstitutions,
  institutionError,
  institutionValue,
  setInstitutionValue,
  open,
  setOpen,
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StudentRegistrationData>();

  const selectedLabel = useMemo(
    () => institutions.find((i) => i.value === institutionValue)?.label ?? "",
    [institutions, institutionValue]
  );

  const onSubmit = async (data: StudentRegistrationData) => {
    if (!institutionValue) {
      alert("Please select your institution.");
      return;
    }
    if (data.userPassword !== data.userConfirmPassword) {
      alert("Password do not matched!");
      return;
    }

    const selected = institutions.find((i) => i.value === institutionValue);

    const payload = {
      name: data.fullName,
      idNumber: data.idNumber,
      email: data.userEmail,
      phone: data.userPhone,
      password: data.userPassword,
      avatarUrl: null,
      institutionId: selected?.id,
      institutionSlug: selected?.value,
    };

    try {
      const res = await fetch("/api/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const json = ct.includes("application/json")
        ? await res.json()
        : { ok: false, error: (await res).text() };

      if (!res.ok) {
        alert(json.error || `Registration failed (${res.status})`);
      }

      alert("Student registered successfully!");
      reset();
      setInstitutionValue("");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Register as Student</h4>
        <p className="text-sm text-blue-700">
          Create a student account to join events, connect with other students,
          and participate in campus activities.
        </p>
      </div>
      <h3 className="text-lg text-center md:text-left font-semibold">
        Student Registration
      </h3>

      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              required
              {...register("fullName", { required: "Full name is required." })}
            />
            <p className="text-red-500 text-xs">
              {errors.fullName && <span>{errors.fullName.message}</span>}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="idNumber">
              Student Number <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="idNumber"
              type="text"
              required
              {...register("idNumber", {
                required: "Student number is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.idNumber && <span>{errors.idNumber.message}</span>}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userEmail">
              Email <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="john.doe@example.com"
              required
              {...register("userEmail", { required: "Email is required." })}
            />
            <p className="text-red-500 text-xs">
              {errors.userEmail && <span>{errors.userEmail.message}</span>}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userPhone">
              Phone Number <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="userPhone"
              type="number"
              placeholder="09xx-xxx-xxxx"
              required
              {...register("userPhone", {
                required: "Phone number is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.userPhone && <span>{errors.userPhone.message}</span>}
            </p>
          </div>
          <div className="grid md:col-span-2 gap-2">
            <Label htmlFor="institutionSelect">Institution</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  type="button"
                  disabled={loadingInstitutions}
                >
                  {loadingInstitutions
                    ? "Loading institutions..."
                    : selectedLabel || "Select Institution..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Search institution..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No Institution found.</CommandEmpty>
                    <CommandGroup>
                      {institutions.map((institution) => (
                        <CommandItem
                          key={institution.value}
                          value={institution.value}
                          onSelect={(currentValue) => {
                            setInstitutionValue(
                              currentValue === institutionValue
                                ? ""
                                : currentValue
                            );
                            setOpen(false);
                          }}
                        >
                          {institution.label}
                          <Check
                            className={
                              institutionValue === institution.value
                                ? "ml-auto opacity-100"
                                : "ml-auto opacity-0"
                            }
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {institutionError && (
              <p className="text-sm text-red-600">Error: {institutionError}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userPassword">Password</Label>
            <Input
              id="userPassword"
              type="password"
              required
              {...register("userPassword", {
                required: "Password is required.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.userPassword && (
                <span>{errors.userPassword.message}</span>
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userConfirmPassword">Confirm Password</Label>
            <Input
              id="userConfirmPassword"
              type="password"
              required
              {...register("userConfirmPassword", {
                required: "Please confirm your password.",
              })}
            />
            <p className="text-red-500 text-xs">
              {errors.userConfirmPassword && (
                <span>{errors.userConfirmPassword.message}</span>
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
            {isSubmitting ? "Submitting..." : "Register as Student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
