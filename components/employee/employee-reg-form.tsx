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
import { useForm } from "react-hook-form";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InstitutionOption, EmployeeRegistrationData } from "@/lib/types";

interface EmployeeFormProps {
  institutions: InstitutionOption[];
  loadingInstitutions: boolean;
  institutionError: string | null;
  institutionValue: string;
  setInstitutionValue: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccessLogin?: () => void;
}

export default function EmployeeRegistrationForm({
  institutions,
  loadingInstitutions,
  institutionError,
  institutionValue,
  setInstitutionValue,
  open,
  setOpen,
  onSuccessLogin,
}: EmployeeFormProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSuccess, setDialogSuccess] = useState<boolean | null>(null);
  const [dialogMessage, setDialogMessage] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<EmployeeRegistrationData>();

  const selectedLabel = useMemo(
    () => institutions.find((i) => i.value === institutionValue)?.label ?? "",
    [institutions, institutionValue]
  );

  // New state for college, department, and program
  const [collegeId, setCollegeId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");
  const [colleges, setColleges] = useState<
    Array<{ collegeId: string; name: string; acronym: string }>
  >([]);
  const [departments, setDepartments] = useState<
    Array<{
      departmentId: string;
      name: string;
      acronym: string;
      collegeId: string;
      collegeName: string;
    }>
  >([]);
  const [programs, setPrograms] = useState<
    Array<{
      programId: string;
      name: string;
      acronym: string;
      departmentId: string;
      departmentName: string;
      collegeId: string;
      collegeName: string;
    }>
  >([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const selectedInstitution = useMemo(
    () => institutions.find((i) => i.value === institutionValue),
    [institutions, institutionValue]
  );

  // Fetch colleges when institution is selected
  useEffect(() => {
    if (selectedInstitution?.id) {
      setLoadingColleges(true);
      fetch(`/api/public/institution/${selectedInstitution.id}/colleges`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setColleges(data.colleges || []);
          }
        })
        .catch((err) => console.error("Failed to fetch colleges:", err))
        .finally(() => setLoadingColleges(false));
    } else {
      setColleges([]);
      setCollegeId("");
    }
  }, [selectedInstitution?.id]);

  // Fetch departments when institution is selected
  useEffect(() => {
    if (selectedInstitution?.id) {
      setLoadingDepartments(true);
      fetch(`/api/public/institution/${selectedInstitution.id}/departments`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setDepartments(data.departments || []);
          }
        })
        .catch((err) => console.error("Failed to fetch departments:", err))
        .finally(() => setLoadingDepartments(false));
    } else {
      setDepartments([]);
      setDepartmentId("");
    }
  }, [selectedInstitution?.id]);

  // Fetch programs when institution is selected
  useEffect(() => {
    if (selectedInstitution?.id) {
      setLoadingPrograms(true);
      fetch(`/api/public/institution/${selectedInstitution.id}/programs`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setPrograms(data.programs || []);
          }
        })
        .catch((err) => console.error("Failed to fetch programs:", err))
        .finally(() => setLoadingPrograms(false));
    } else {
      setPrograms([]);
      setProgramId("");
    }
  }, [selectedInstitution?.id]);

  // Reset dependent fields when institution changes
  useEffect(() => {
    setCollegeId("");
    setDepartmentId("");
    setProgramId("");
  }, [institutionValue]);

  // Reset department and program when college changes
  useEffect(() => {
    setDepartmentId("");
    setProgramId("");
  }, [collegeId]);

  // Reset program when department changes
  useEffect(() => {
    setProgramId("");
  }, [departmentId]);

  // Filter departments by selected college
  const filteredDepartments = useMemo(() => {
    if (!collegeId) return [];
    return departments.filter((dept) => dept.collegeId === collegeId);
  }, [departments, collegeId]);

  // Filter programs by selected department
  const filteredPrograms = useMemo(() => {
    if (!departmentId) return [];
    return programs.filter((prog) => prog.departmentId === departmentId);
  }, [programs, departmentId]);

  const onSubmit = async (data: EmployeeRegistrationData) => {
    if (!institutionValue) {
      alert("Please select your institution.");
      return;
    }
    if (!collegeId) {
      alert("Please select your college.");
      return;
    }
    if (!departmentId) {
      alert("Please select your department.");
      return;
    }
    if (!programId) {
      alert("Please select your program.");
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
      collegeId,
      departmentId,
      programId,
    };

    try {
      const res = await fetch("/api/register/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const json = ct.includes("application/json")
        ? await res.json()
        : { ok: false, error: await res.text() };

      if (!res.ok || !json?.ok) {
        const msg = String(
          json?.error || `Registration failed (${res.status})`
        );
        // Map server errors to specific fields where possible
        if (/email/i.test(msg)) {
          setError("userEmail", { type: "server", message: msg });
        }
        if (/(employee\s*number|id\s*number)/i.test(msg)) {
          setError("idNumber", { type: "server", message: msg });
        }
        if (/institution/i.test(msg)) {
          // selector error is surfaced by existing institutionError rendering
        }
        setDialogSuccess(false);
        setDialogMessage(msg);
        setDialogOpen(true);
        return;
      }

      setDialogSuccess(true);
      setDialogMessage("Employee registered successfully!");
      setDialogOpen(true);
      reset();
      setInstitutionValue("");
      setCollegeId("");
      setDepartmentId("");
      setProgramId("");
      try {
        onSuccessLogin?.();
      } catch (e) {
        console.error("onSuccessLogin callback failed", e);
      }
    } catch (e) {
      setDialogSuccess(false);
      setDialogMessage(e instanceof Error ? e.message : String(e));
      setDialogOpen(true);
    }
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
              type="tel"
              placeholder="09xx-xxx-xxxx"
              maxLength={11}
              required
              {...register("userPhone", {
                required: "Phone number is required.",
                pattern: {
                  value: /^\d{11}$/,
                  message: "Phone number must be exactly 11 digits.",
                },
              })}
              onInput={(e) => {
                // Only allow numeric input
                const target = e.target as HTMLInputElement;
                const value = target.value.replace(/\D/g, "");
                if (value.length <= 11) {
                  target.value = value;
                }
              }}
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
          <div className="grid md:col-span-2 gap-2">
            <Label htmlFor="collegeSelect">
              College <span className="text-red-600 m-0 p-0">*</span>
            </Label>
            <Select
              value={collegeId}
              onValueChange={setCollegeId}
              disabled={
                !institutionValue || loadingColleges || colleges.length === 0
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingColleges
                      ? "Loading colleges..."
                      : !institutionValue
                      ? "Select institution first"
                      : colleges.length === 0
                      ? "No colleges available"
                      : "Select College..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {colleges.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No colleges available
                  </div>
                ) : (
                  colleges.map((college) => (
                    <SelectItem
                      key={college.collegeId}
                      value={college.collegeId}
                    >
                      {college.name} ({college.acronym})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!institutionValue && (
              <p className="text-xs text-muted-foreground">
                Please select an institution first
              </p>
            )}
            {institutionValue && !loadingColleges && colleges.length === 0 && (
              <p className="text-xs text-amber-600">
                No colleges are available for this institution. Please contact
                your institution administrator.
              </p>
            )}
          </div>
          <div className="grid md:col-span-2 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="departmentSelect">
                Department <span className="text-red-600 m-0 p-0">*</span>
              </Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={
                  !collegeId ||
                  loadingDepartments ||
                  filteredDepartments.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingDepartments
                        ? "Loading departments..."
                        : !collegeId
                        ? "Select college first"
                        : filteredDepartments.length === 0
                        ? "No departments available"
                        : "Select Department..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No departments available
                    </div>
                  ) : (
                    filteredDepartments.map((dept) => (
                      <SelectItem
                        key={dept.departmentId}
                        value={dept.departmentId}
                      >
                        {dept.name} ({dept.acronym})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!collegeId && (
                <p className="text-xs text-muted-foreground">
                  Please select a college first
                </p>
              )}
              {collegeId &&
                !loadingDepartments &&
                filteredDepartments.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No departments are available for this college. Please
                    contact your institution administrator.
                  </p>
                )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="programSelect">
                Program <span className="text-red-600 m-0 p-0">*</span>
              </Label>
              <Select
                value={programId}
                onValueChange={setProgramId}
                disabled={
                  !departmentId ||
                  loadingPrograms ||
                  filteredPrograms.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingPrograms
                        ? "Loading programs..."
                        : !departmentId
                        ? "Select department first"
                        : filteredPrograms.length === 0
                        ? "No programs available"
                        : "Select Program..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredPrograms.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No programs available
                    </div>
                  ) : (
                    filteredPrograms.map((program) => (
                      <SelectItem
                        key={program.programId}
                        value={program.programId}
                      >
                        {program.name} ({program.acronym})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!departmentId && (
                <p className="text-xs text-muted-foreground">
                  Please select a department first
                </p>
              )}
              {departmentId &&
                !loadingPrograms &&
                filteredPrograms.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No programs are available for this department. Please
                    contact your institution administrator.
                  </p>
                )}
            </div>
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
