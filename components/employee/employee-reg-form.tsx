"use client";

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
import { useForm } from "react-hook-form";
import type { EmployeeRegistrationData } from "@/lib/types";

interface EmployeeRegistrationFormProps {
  institutionValue: string;
  setInstitutionValue: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const institutions = [
  {
    value: "parsu",
    label: "Partido State University",
  },
  {
    value: "cbsua",
    label: "Central Bicol State University of Agriculture",
  },
  {
    value: "cspc",
    label: "Camarines Sur Polytechnic Colleges",
  },
  {
    value: "bu-polangui",
    label: "Bicol University - Polangui Campus",
  },
  {
    value: "gcc",
    label: "Goa Community",
  },
];

export default function EmployeeRegistrationForm({
  institutionValue,
  setInstitutionValue,
  open,
  setOpen,
}: EmployeeRegistrationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeRegistrationData>();

  const onSubmit = async (data: EmployeeRegistrationData) => {
    if (data.userPassword !== data.userConfirmPassword) {
      alert("Password do not match.");
      return;
    }

    // API CALL HERE

    reset();
    alert("Employee Registered!");
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-medium text-yellow-900 mb-2">
          Register as Employee
        </h4>
        <p className="text-sm text-yellow-700">
          Create an employee account to join events, manage clubs and
          organizations, and participate in campus activities.
        </p>
      </div>
      <h3 className="text-lg text-center md:text-left font-semibold">
        Employee Registration
      </h3>
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
              Employee Number <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Input
              id="idNumber"
              type="text"
              required
              {...register("idNumber", {
                required: "Employee number is required.",
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
                >
                  {institutionValue
                    ? institutions.find((i) => i.value === institutionValue)
                        ?.label
                    : "Select Institution..."}
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
            {isSubmitting ? "Submitting..." : "Register as Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
