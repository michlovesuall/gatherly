"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import type {
  AdminUserStats,
  AdminUserListItem,
} from "@/lib/repos/admin-users";
import type { InstitutionOption } from "@/lib/types";

export interface AdminUsersPageProps {
  stats: AdminUserStats;
  users: AdminUserListItem[];
  institutions: Array<{ id: string; name: string }>;
  initialRole: string;
  initialStatus: string;
  initialInstitution: string;
  initialSearch: string;
}

interface StudentFormData {
  fullName: string;
  idNumber: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
  userConfirmPassword: string;
}

interface EmployeeFormData {
  fullName: string;
  idNumber: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
  userConfirmPassword: string;
}

export function AdminUsersPage({
  stats,
  users: initialUsers,
  institutions,
  initialRole,
  initialStatus,
  initialInstitution,
  initialSearch,
}: AdminUsersPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [institutionFilter, setInstitutionFilter] = useState(initialInstitution);
  const [institutionPopoverOpen, setInstitutionPopoverOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userType, setUserType] = useState<"student" | "employee">("student");
  const [institutionOptions, setInstitutionOptions] = useState<InstitutionOption[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [studentInstitution, setStudentInstitution] = useState("");
  const [studentInstitutionOpen, setStudentInstitutionOpen] = useState(false);
  const [employeeInstitution, setEmployeeInstitution] = useState("");
  const [employeeInstitutionOpen, setEmployeeInstitutionOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form hooks
  const studentForm = useForm<StudentFormData>();
  const employeeForm = useForm<EmployeeFormData>();

  // Get selected institution name for display
  const selectedInstitution = institutions.find(
    (inst) => inst.id === institutionFilter
  );

  // Fetch institutions for the Add User modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    
    let cancelled = false;
    (async () => {
      setLoadingInstitutions(true);
      setInstitutionError(null);
      try {
        const res = await fetch("/api/institution?limit=200", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
        if (!cancelled) setInstitutionOptions(data.items ?? []);
      } catch (e) {
        if (!cancelled)
          setInstitutionError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoadingInstitutions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAddModalOpen]);

  const selectedStudentInstitutionLabel = useMemo(
    () => institutionOptions.find((i) => i.value === studentInstitution)?.label ?? "",
    [institutionOptions, studentInstitution]
  );

  const selectedEmployeeInstitutionLabel = useMemo(
    () => institutionOptions.find((i) => i.value === employeeInstitution)?.label ?? "",
    [institutionOptions, employeeInstitution]
  );

  const handleAddStudent = async (data: StudentFormData) => {
    if (!studentInstitution) {
      setFormError("Please select an institution.");
      return;
    }
    if (data.userPassword !== data.userConfirmPassword) {
      setFormError("Passwords do not match!");
      return;
    }

    const selected = institutionOptions.find((i) => i.value === studentInstitution);
    if (!selected) {
      setFormError("Selected institution not found.");
      return;
    }

    setFormError(null);

    try {
      const res = await fetch("/api/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          idNumber: data.idNumber,
          email: data.userEmail,
          phone: data.userPhone,
          password: data.userPassword,
          avatarUrl: null,
          institutionId: selected.id,
          institutionSlug: selected.value,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        const msg = String(json?.error || `Registration failed (${res.status})`);
        setFormError(msg);
        return;
      }

      // Success
      setIsAddModalOpen(false);
      studentForm.reset();
      setStudentInstitution("");
      setFormError(null);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleAddEmployee = async (data: EmployeeFormData) => {
    if (!employeeInstitution) {
      setFormError("Please select an institution.");
      return;
    }
    if (data.userPassword !== data.userConfirmPassword) {
      setFormError("Passwords do not match!");
      return;
    }

    const selected = institutionOptions.find((i) => i.value === employeeInstitution);
    if (!selected) {
      setFormError("Selected institution not found.");
      return;
    }

    setFormError(null);

    try {
      const res = await fetch("/api/register/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          idNumber: data.idNumber,
          email: data.userEmail,
          phone: data.userPhone,
          password: data.userPassword,
          avatarUrl: null,
          institutionId: selected.id,
          institutionSlug: selected.value,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        const msg = String(json?.error || `Registration failed (${res.status})`);
        setFormError(msg);
        return;
      }

      // Success
      setIsAddModalOpen(false);
      employeeForm.reset();
      setEmployeeInstitution("");
      setFormError(null);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleFilterChange = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (institutionFilter !== "all") params.set("institution", institutionFilter);
      if (searchQuery) params.set("search", searchQuery);
      router.push(`/dashboard/admin/users?${params.toString()}`);
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (institutionFilter !== "all") params.set("institution", institutionFilter);
      if (value) params.set("search", value);
      router.push(`/dashboard/admin/users?${params.toString()}`);
    });
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value !== "all") params.set("role", value);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (institutionFilter !== "all") params.set("institution", institutionFilter);
      if (searchQuery) params.set("search", searchQuery);
      router.push(`/dashboard/admin/users?${params.toString()}`);
    });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (value !== "all") params.set("status", value);
      if (institutionFilter !== "all") params.set("institution", institutionFilter);
      if (searchQuery) params.set("search", searchQuery);
      router.push(`/dashboard/admin/users?${params.toString()}`);
    });
  };

  const handleInstitutionChange = (value: string) => {
    setInstitutionFilter(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (value !== "all") params.set("institution", value);
      if (searchQuery) params.set("search", searchQuery);
      router.push(`/dashboard/admin/users?${params.toString()}`);
    });
  };

  const handleAction = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    setActionLoading(userId);

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Action failed:", error);
      alert(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const getRoleBadge = (role: string) => {
    return role === "employee" ? "Employee" : "Student";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users across institutions
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disabledUsers}</div>
            <p className="text-xs text-muted-foreground">
              Disabled accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>All Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              {/* Institution Filter */}
              <Popover open={institutionPopoverOpen} onOpenChange={setInstitutionPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={institutionPopoverOpen}
                    className="w-full sm:w-[200px] justify-between"
                    type="button"
                  >
                    {institutionFilter === "all" || !selectedInstitution
                      ? "All Institutions"
                      : selectedInstitution.name}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full sm:w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search institution..." />
                    <CommandList>
                      <CommandEmpty>No institution found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Institutions"
                          onSelect={() => {
                            handleInstitutionChange("all");
                            setInstitutionPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={
                              institutionFilter === "all"
                                ? "mr-2 h-4 w-4 opacity-100"
                                : "mr-2 h-4 w-4 opacity-0"
                            }
                          />
                          All Institutions
                        </CommandItem>
                        {institutions.map((inst) => (
                          <CommandItem
                            key={inst.id}
                            value={inst.name}
                            onSelect={() => {
                              handleInstitutionChange(inst.id);
                              setInstitutionPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={
                                institutionFilter === inst.id
                                  ? "mr-2 h-4 w-4 opacity-100"
                                  : "mr-2 h-4 w-4 opacity-0"
                              }
                            />
                            {inst.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  initialUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.institutionName}
                      </TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRoleBadge(user.platformRole)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status === "active" ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={
                            user.status === "active" ? "destructive" : "default"
                          }
                          onClick={() => handleAction(user.id, user.status)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.status === "active" ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) {
          // Reset forms when modal closes
          studentForm.reset();
          employeeForm.reset();
          setStudentInstitution("");
          setEmployeeInstitution("");
          setFormError(null);
          setUserType("student");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Register a new student or employee account.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={userType} onValueChange={(v) => {
            setUserType(v as "student" | "employee");
            setFormError(null);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="employee">Employee</TabsTrigger>
            </TabsList>
            
            {/* Student Form */}
            <TabsContent value="student">
              <form onSubmit={studentForm.handleSubmit(handleAddStudent)}>
                <div className="space-y-4 py-4">
                  {formError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="student-fullName">
                        Full Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="student-fullName"
                        placeholder="John Doe"
                        {...studentForm.register("fullName", {
                          required: "Full name is required.",
                        })}
                      />
                      {studentForm.formState.errors.fullName && (
                        <p className="text-xs text-red-600">
                          {studentForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="student-idNumber">
                        Student Number <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="student-idNumber"
                        {...studentForm.register("idNumber", {
                          required: "Student number is required.",
                        })}
                      />
                      {studentForm.formState.errors.idNumber && (
                        <p className="text-xs text-red-600">
                          {studentForm.formState.errors.idNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="student-email">
                        Email <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="student-email"
                        type="email"
                        placeholder="john.doe@example.com"
                        {...studentForm.register("userEmail", {
                          required: "Email is required.",
                        })}
                      />
                      {studentForm.formState.errors.userEmail && (
                        <p className="text-xs text-red-600">
                          {studentForm.formState.errors.userEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="student-phone">
                        Phone Number <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="student-phone"
                        type="tel"
                        placeholder="09xx-xxx-xxxx"
                        {...studentForm.register("userPhone", {
                          required: "Phone number is required.",
                        })}
                      />
                      {studentForm.formState.errors.userPhone && (
                        <p className="text-xs text-red-600">
                          {studentForm.formState.errors.userPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="student-institution">Institution</Label>
                      <Popover open={studentInstitutionOpen} onOpenChange={setStudentInstitutionOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={studentInstitutionOpen}
                            className="w-full justify-between"
                            type="button"
                            disabled={loadingInstitutions}
                          >
                            {loadingInstitutions
                              ? "Loading institutions..."
                              : selectedStudentInstitutionLabel || "Select Institution..."}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search institution..." />
                            <CommandList>
                              <CommandEmpty>No Institution found.</CommandEmpty>
                              <CommandGroup>
                                {institutionOptions.map((institution) => (
                                  <CommandItem
                                    key={institution.value}
                                    value={institution.value}
                                    onSelect={(currentValue) => {
                                      setStudentInstitution(
                                        currentValue === studentInstitution ? "" : currentValue
                                      );
                                      setStudentInstitutionOpen(false);
                                    }}
                                  >
                                    {institution.label}
                                    <Check
                                      className={
                                        studentInstitution === institution.value
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
                      <Label htmlFor="student-password">Password</Label>
                      <Input
                        id="student-password"
                        type="password"
                        {...studentForm.register("userPassword", {
                          required: "Password is required.",
                        })}
                      />
                      {studentForm.formState.errors.userPassword && (
                        <p className="text-xs text-red-600">
                          {studentForm.formState.errors.userPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="student-confirmPassword">Confirm Password</Label>
                      <Input
                        id="student-confirmPassword"
                        type="password"
                        {...studentForm.register("userConfirmPassword", {
                          required: "Please confirm your password.",
                        })}
                      />
                      {studentForm.formState.errors.userConfirmPassword && (
                        <p className="text-xs text-red-600">
                          {studentForm.formState.errors.userConfirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      studentForm.reset();
                      setStudentInstitution("");
                      setFormError(null);
                    }}
                    disabled={studentForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={studentForm.formState.isSubmitting}>
                    {studentForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Add Student"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* Employee Form */}
            <TabsContent value="employee">
              <form onSubmit={employeeForm.handleSubmit(handleAddEmployee)}>
                <div className="space-y-4 py-4">
                  {formError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="employee-fullName">
                        Full Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="employee-fullName"
                        placeholder="John Doe"
                        {...employeeForm.register("fullName", {
                          required: "Full name is required.",
                        })}
                      />
                      {employeeForm.formState.errors.fullName && (
                        <p className="text-xs text-red-600">
                          {employeeForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="employee-idNumber">
                        Employee Number <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="employee-idNumber"
                        {...employeeForm.register("idNumber", {
                          required: "Employee number is required.",
                        })}
                      />
                      {employeeForm.formState.errors.idNumber && (
                        <p className="text-xs text-red-600">
                          {employeeForm.formState.errors.idNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="employee-email">
                        Email <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="employee-email"
                        type="email"
                        placeholder="john.doe@example.com"
                        {...employeeForm.register("userEmail", {
                          required: "Email is required.",
                        })}
                      />
                      {employeeForm.formState.errors.userEmail && (
                        <p className="text-xs text-red-600">
                          {employeeForm.formState.errors.userEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="employee-phone">
                        Phone Number <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="employee-phone"
                        type="tel"
                        placeholder="09xx-xxx-xxxx"
                        {...employeeForm.register("userPhone", {
                          required: "Phone number is required.",
                        })}
                      />
                      {employeeForm.formState.errors.userPhone && (
                        <p className="text-xs text-red-600">
                          {employeeForm.formState.errors.userPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="employee-institution">Institution</Label>
                      <Popover open={employeeInstitutionOpen} onOpenChange={setEmployeeInstitutionOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeeInstitutionOpen}
                            className="w-full justify-between"
                            type="button"
                            disabled={loadingInstitutions}
                          >
                            {loadingInstitutions
                              ? "Loading institutions..."
                              : selectedEmployeeInstitutionLabel || "Select Institution..."}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search institution..." />
                            <CommandList>
                              <CommandEmpty>No Institution found.</CommandEmpty>
                              <CommandGroup>
                                {institutionOptions.map((institution) => (
                                  <CommandItem
                                    key={institution.value}
                                    value={institution.value}
                                    onSelect={(currentValue) => {
                                      setEmployeeInstitution(
                                        currentValue === employeeInstitution ? "" : currentValue
                                      );
                                      setEmployeeInstitutionOpen(false);
                                    }}
                                  >
                                    {institution.label}
                                    <Check
                                      className={
                                        employeeInstitution === institution.value
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
                      <Label htmlFor="employee-password">Password</Label>
                      <Input
                        id="employee-password"
                        type="password"
                        {...employeeForm.register("userPassword", {
                          required: "Password is required.",
                        })}
                      />
                      {employeeForm.formState.errors.userPassword && (
                        <p className="text-xs text-red-600">
                          {employeeForm.formState.errors.userPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="employee-confirmPassword">Confirm Password</Label>
                      <Input
                        id="employee-confirmPassword"
                        type="password"
                        {...employeeForm.register("userConfirmPassword", {
                          required: "Please confirm your password.",
                        })}
                      />
                      {employeeForm.formState.errors.userConfirmPassword && (
                        <p className="text-xs text-red-600">
                          {employeeForm.formState.errors.userConfirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      employeeForm.reset();
                      setEmployeeInstitution("");
                      setFormError(null);
                    }}
                    disabled={employeeForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={employeeForm.formState.isSubmitting}>
                    {employeeForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Add Employee"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

