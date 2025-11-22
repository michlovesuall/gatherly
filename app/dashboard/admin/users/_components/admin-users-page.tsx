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
  
  // Employee form additional fields
  const [employeeCollegeId, setEmployeeCollegeId] = useState<string>("");
  const [employeeDepartmentId, setEmployeeDepartmentId] = useState<string>("");
  const [employeeProgramId, setEmployeeProgramId] = useState<string>("");
  const [employeeColleges, setEmployeeColleges] = useState<Array<{ collegeId: string; name: string; acronym: string }>>([]);
  const [employeeDepartments, setEmployeeDepartments] = useState<Array<{ departmentId: string; name: string; acronym: string; collegeId: string; collegeName: string }>>([]);
  const [employeePrograms, setEmployeePrograms] = useState<Array<{ programId: string; name: string; acronym: string; departmentId: string; departmentName: string; collegeId: string; collegeName: string }>>([]);
  const [loadingEmployeeColleges, setLoadingEmployeeColleges] = useState(false);
  const [loadingEmployeeDepartments, setLoadingEmployeeDepartments] = useState(false);
  const [loadingEmployeePrograms, setLoadingEmployeePrograms] = useState(false);
  
  // Student form additional fields
  const [studentCollegeId, setStudentCollegeId] = useState<string>("");
  const [studentDepartmentId, setStudentDepartmentId] = useState<string>("");
  const [studentProgramId, setStudentProgramId] = useState<string>("");
  const [studentColleges, setStudentColleges] = useState<Array<{ collegeId: string; name: string; acronym: string }>>([]);
  const [studentDepartments, setStudentDepartments] = useState<Array<{ departmentId: string; name: string; acronym: string; collegeId: string; collegeName: string }>>([]);
  const [studentPrograms, setStudentPrograms] = useState<Array<{ programId: string; name: string; acronym: string; departmentId: string; departmentName: string; collegeId: string; collegeName: string }>>([]);
  const [loadingStudentColleges, setLoadingStudentColleges] = useState(false);
  const [loadingStudentDepartments, setLoadingStudentDepartments] = useState(false);
  const [loadingStudentPrograms, setLoadingStudentPrograms] = useState(false);
  
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

  const selectedEmployeeInstitution = useMemo(
    () => institutionOptions.find((i) => i.value === employeeInstitution),
    [institutionOptions, employeeInstitution]
  );

  // Fetch colleges, departments, and programs when employee institution is selected
  useEffect(() => {
    if (selectedEmployeeInstitution?.id) {
      setLoadingEmployeeColleges(true);
      fetch(`/api/public/institution/${selectedEmployeeInstitution.id}/colleges`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setEmployeeColleges(data.colleges || []);
          }
        })
        .catch((err) => console.error("Failed to fetch colleges:", err))
        .finally(() => setLoadingEmployeeColleges(false));
    } else {
      setEmployeeColleges([]);
      setEmployeeCollegeId("");
    }
  }, [selectedEmployeeInstitution?.id]);

  useEffect(() => {
    if (selectedEmployeeInstitution?.id) {
      setLoadingEmployeeDepartments(true);
      fetch(`/api/public/institution/${selectedEmployeeInstitution.id}/departments`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setEmployeeDepartments(data.departments || []);
          }
        })
        .catch((err) => console.error("Failed to fetch departments:", err))
        .finally(() => setLoadingEmployeeDepartments(false));
    } else {
      setEmployeeDepartments([]);
      setEmployeeDepartmentId("");
    }
  }, [selectedEmployeeInstitution?.id]);

  useEffect(() => {
    if (selectedEmployeeInstitution?.id) {
      setLoadingEmployeePrograms(true);
      fetch(`/api/public/institution/${selectedEmployeeInstitution.id}/programs`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setEmployeePrograms(data.programs || []);
          }
        })
        .catch((err) => console.error("Failed to fetch programs:", err))
        .finally(() => setLoadingEmployeePrograms(false));
    } else {
      setEmployeePrograms([]);
      setEmployeeProgramId("");
    }
  }, [selectedEmployeeInstitution?.id]);

  // Reset dependent fields when employee institution changes
  useEffect(() => {
    setEmployeeCollegeId("");
    setEmployeeDepartmentId("");
    setEmployeeProgramId("");
  }, [employeeInstitution]);

  // Reset department and program when employee college changes
  useEffect(() => {
    setEmployeeDepartmentId("");
    setEmployeeProgramId("");
  }, [employeeCollegeId]);

  // Reset program when employee department changes
  useEffect(() => {
    setEmployeeProgramId("");
  }, [employeeDepartmentId]);

  // Filter departments by selected employee college
  const filteredEmployeeDepartments = useMemo(() => {
    if (!employeeCollegeId) return [];
    return employeeDepartments.filter((dept) => dept.collegeId === employeeCollegeId);
  }, [employeeDepartments, employeeCollegeId]);

  // Filter programs by selected employee department
  const filteredEmployeePrograms = useMemo(() => {
    if (!employeeDepartmentId) return [];
    return employeePrograms.filter((prog) => prog.departmentId === employeeDepartmentId);
  }, [employeePrograms, employeeDepartmentId]);

  const selectedStudentInstitution = useMemo(
    () => institutionOptions.find((i) => i.value === studentInstitution),
    [institutionOptions, studentInstitution]
  );

  // Fetch colleges, departments, and programs when student institution is selected
  useEffect(() => {
    if (selectedStudentInstitution?.id) {
      setLoadingStudentColleges(true);
      fetch(`/api/public/institution/${selectedStudentInstitution.id}/colleges`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setStudentColleges(data.colleges || []);
          }
        })
        .catch((err) => console.error("Failed to fetch colleges:", err))
        .finally(() => setLoadingStudentColleges(false));
    } else {
      setStudentColleges([]);
      setStudentCollegeId("");
    }
  }, [selectedStudentInstitution?.id]);

  useEffect(() => {
    if (selectedStudentInstitution?.id) {
      setLoadingStudentDepartments(true);
      fetch(`/api/public/institution/${selectedStudentInstitution.id}/departments`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setStudentDepartments(data.departments || []);
          }
        })
        .catch((err) => console.error("Failed to fetch departments:", err))
        .finally(() => setLoadingStudentDepartments(false));
    } else {
      setStudentDepartments([]);
      setStudentDepartmentId("");
    }
  }, [selectedStudentInstitution?.id]);

  useEffect(() => {
    if (selectedStudentInstitution?.id) {
      setLoadingStudentPrograms(true);
      fetch(`/api/public/institution/${selectedStudentInstitution.id}/programs`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setStudentPrograms(data.programs || []);
          }
        })
        .catch((err) => console.error("Failed to fetch programs:", err))
        .finally(() => setLoadingStudentPrograms(false));
    } else {
      setStudentPrograms([]);
      setStudentProgramId("");
    }
  }, [selectedStudentInstitution?.id]);

  // Reset dependent fields when institution changes
  useEffect(() => {
    setStudentCollegeId("");
    setStudentDepartmentId("");
    setStudentProgramId("");
  }, [studentInstitution]);

  // Reset department and program when college changes
  useEffect(() => {
    setStudentDepartmentId("");
    setStudentProgramId("");
  }, [studentCollegeId]);

  // Reset program when department changes
  useEffect(() => {
    setStudentProgramId("");
  }, [studentDepartmentId]);

  // Filter departments by selected college
  const filteredStudentDepartments = useMemo(() => {
    if (!studentCollegeId) return [];
    return studentDepartments.filter((dept) => dept.collegeId === studentCollegeId);
  }, [studentDepartments, studentCollegeId]);

  // Filter programs by selected department
  const filteredStudentPrograms = useMemo(() => {
    if (!studentDepartmentId) return [];
    return studentPrograms.filter((prog) => prog.departmentId === studentDepartmentId);
  }, [studentPrograms, studentDepartmentId]);

  const handleAddStudent = async (data: StudentFormData) => {
    if (!studentInstitution) {
      setFormError("Please select an institution.");
      return;
    }
    if (!studentCollegeId) {
      setFormError("Please select a college.");
      return;
    }
    if (!studentDepartmentId) {
      setFormError("Please select a department.");
      return;
    }
    if (!studentProgramId) {
      setFormError("Please select a program.");
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
          collegeId: studentCollegeId,
          departmentId: studentDepartmentId,
          programId: studentProgramId,
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
      setStudentCollegeId("");
      setStudentDepartmentId("");
      setStudentProgramId("");
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
    if (!employeeCollegeId) {
      setFormError("Please select a college.");
      return;
    }
    if (!employeeDepartmentId) {
      setFormError("Please select a department.");
      return;
    }
    if (!employeeProgramId) {
      setFormError("Please select a program.");
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
          collegeId: employeeCollegeId,
          departmentId: employeeDepartmentId,
          programId: employeeProgramId,
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
      setEmployeeCollegeId("");
      setEmployeeDepartmentId("");
      setEmployeeProgramId("");
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
          setStudentCollegeId("");
          setStudentDepartmentId("");
          setStudentProgramId("");
          setEmployeeInstitution("");
          setEmployeeCollegeId("");
          setEmployeeDepartmentId("");
          setEmployeeProgramId("");
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

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="student-college">
                        College <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={studentCollegeId}
                        onValueChange={setStudentCollegeId}
                        disabled={!studentInstitution || loadingStudentColleges || studentColleges.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingStudentColleges ? "Loading colleges..." : !studentInstitution ? "Select institution first" : studentColleges.length === 0 ? "No colleges available" : "Select College..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {studentColleges.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No colleges available
                            </div>
                          ) : (
                            studentColleges.map((college) => (
                              <SelectItem key={college.collegeId} value={college.collegeId}>
                                {college.name} ({college.acronym})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {!studentInstitution && (
                        <p className="text-xs text-muted-foreground">
                          Please select an institution first
                        </p>
                      )}
                      {studentInstitution && !loadingStudentColleges && studentColleges.length === 0 && (
                        <p className="text-xs text-amber-600">
                          No colleges are available for this institution. Please add colleges in the institution settings.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="student-department">
                          Department <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={studentDepartmentId}
                          onValueChange={setStudentDepartmentId}
                          disabled={!studentCollegeId || loadingStudentDepartments || filteredStudentDepartments.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingStudentDepartments ? "Loading departments..." : !studentCollegeId ? "Select college first" : filteredStudentDepartments.length === 0 ? "No departments available" : "Select Department..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredStudentDepartments.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No departments available
                              </div>
                            ) : (
                              filteredStudentDepartments.map((dept) => (
                                <SelectItem key={dept.departmentId} value={dept.departmentId}>
                                  {dept.name} ({dept.acronym})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!studentCollegeId && (
                          <p className="text-xs text-muted-foreground">
                            Please select a college first
                          </p>
                        )}
                        {studentCollegeId && !loadingStudentDepartments && filteredStudentDepartments.length === 0 && (
                          <p className="text-xs text-amber-600">
                            No departments are available for this college. Please add departments in the institution settings.
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="student-program">
                          Program <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={studentProgramId}
                          onValueChange={setStudentProgramId}
                          disabled={!studentDepartmentId || loadingStudentPrograms || filteredStudentPrograms.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingStudentPrograms ? "Loading programs..." : !studentDepartmentId ? "Select department first" : filteredStudentPrograms.length === 0 ? "No programs available" : "Select Program..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredStudentPrograms.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No programs available
                              </div>
                            ) : (
                              filteredStudentPrograms.map((program) => (
                                <SelectItem key={program.programId} value={program.programId}>
                                  {program.name} ({program.acronym})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!studentDepartmentId && (
                          <p className="text-xs text-muted-foreground">
                            Please select a department first
                          </p>
                        )}
                        {studentDepartmentId && !loadingStudentPrograms && filteredStudentPrograms.length === 0 && (
                          <p className="text-xs text-amber-600">
                            No programs are available for this department. Please add programs in the institution settings.
                          </p>
                        )}
                      </div>
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

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="employee-college">
                        College <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={employeeCollegeId}
                        onValueChange={setEmployeeCollegeId}
                        disabled={!employeeInstitution || loadingEmployeeColleges || employeeColleges.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingEmployeeColleges ? "Loading colleges..." : !employeeInstitution ? "Select institution first" : employeeColleges.length === 0 ? "No colleges available" : "Select College..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {employeeColleges.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No colleges available
                            </div>
                          ) : (
                            employeeColleges.map((college) => (
                              <SelectItem key={college.collegeId} value={college.collegeId}>
                                {college.name} ({college.acronym})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {!employeeInstitution && (
                        <p className="text-xs text-muted-foreground">
                          Please select an institution first
                        </p>
                      )}
                      {employeeInstitution && !loadingEmployeeColleges && employeeColleges.length === 0 && (
                        <p className="text-xs text-amber-600">
                          No colleges are available for this institution. Please add colleges in the institution settings.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="employee-department">
                          Department <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={employeeDepartmentId}
                          onValueChange={setEmployeeDepartmentId}
                          disabled={!employeeCollegeId || loadingEmployeeDepartments || filteredEmployeeDepartments.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingEmployeeDepartments ? "Loading departments..." : !employeeCollegeId ? "Select college first" : filteredEmployeeDepartments.length === 0 ? "No departments available" : "Select Department..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredEmployeeDepartments.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No departments available
                              </div>
                            ) : (
                              filteredEmployeeDepartments.map((dept) => (
                                <SelectItem key={dept.departmentId} value={dept.departmentId}>
                                  {dept.name} ({dept.acronym})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!employeeCollegeId && (
                          <p className="text-xs text-muted-foreground">
                            Please select a college first
                          </p>
                        )}
                        {employeeCollegeId && !loadingEmployeeDepartments && filteredEmployeeDepartments.length === 0 && (
                          <p className="text-xs text-amber-600">
                            No departments are available for this college. Please add departments in the institution settings.
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="employee-program">
                          Program <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={employeeProgramId}
                          onValueChange={setEmployeeProgramId}
                          disabled={!employeeDepartmentId || loadingEmployeePrograms || filteredEmployeePrograms.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingEmployeePrograms ? "Loading programs..." : !employeeDepartmentId ? "Select department first" : filteredEmployeePrograms.length === 0 ? "No programs available" : "Select Program..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredEmployeePrograms.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No programs available
                              </div>
                            ) : (
                              filteredEmployeePrograms.map((program) => (
                                <SelectItem key={program.programId} value={program.programId}>
                                  {program.name} ({program.acronym})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!employeeDepartmentId && (
                          <p className="text-xs text-muted-foreground">
                            Please select a department first
                          </p>
                        )}
                        {employeeDepartmentId && !loadingEmployeePrograms && filteredEmployeePrograms.length === 0 && (
                          <p className="text-xs text-amber-600">
                            No programs are available for this department. Please add programs in the institution settings.
                          </p>
                        )}
                      </div>
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
                      setEmployeeCollegeId("");
                      setEmployeeDepartmentId("");
                      setEmployeeProgramId("");
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

