"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  UserCheck,
  Search,
  Loader2,
  Eye,
  Check,
  X,
  Power,
  PowerOff,
  Plus,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import type {
  InstitutionUserStats,
  InstitutionUserListItem,
} from "@/lib/repos/institution";

export interface InstitutionUsersPageProps {
  institutionId: string;
  institutionName: string;
  institutionSlug: string;
  stats: InstitutionUserStats;
  pendingUsers: InstitutionUserListItem[];
  pendingTotal: number;
  pendingPage: number;
  pendingPageSize: number;
  pendingSearch: string;
  pendingUserType: string;
  approvedUsers: InstitutionUserListItem[];
  approvedTotal: number;
  approvedPage: number;
  approvedPageSize: number;
  approvedSearch: string;
  approvedUserType: string;
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

export function InstitutionUsersPage({
  institutionId,
  institutionName,
  institutionSlug,
  stats,
  pendingUsers: initialPendingUsers,
  pendingTotal: initialPendingTotal,
  pendingPage: initialPendingPage,
  pendingPageSize: initialPendingPageSize,
  pendingSearch: initialPendingSearch,
  pendingUserType: initialPendingUserType,
  approvedUsers: initialApprovedUsers,
  approvedTotal: initialApprovedTotal,
  approvedPage: initialApprovedPage,
  approvedPageSize: initialApprovedPageSize,
  approvedSearch: initialApprovedSearch,
  approvedUserType: initialApprovedUserType,
}: InstitutionUsersPageProps) {
  const router = useRouter();

  // Pending users state
  const [pendingSearch, setPendingSearch] = useState(initialPendingSearch);
  const [pendingUserTypeFilter, setPendingUserTypeFilter] = useState(
    initialPendingUserType
  );
  const [pendingPage, setPendingPage] = useState(initialPendingPage);
  const [pendingPageSize, setPendingPageSize] = useState(initialPendingPageSize);

  // Approved users state
  const [approvedSearch, setApprovedSearch] = useState(initialApprovedSearch);
  const [approvedUserTypeFilter, setApprovedUserTypeFilter] = useState(
    initialApprovedUserType
  );
  const [approvedPage, setApprovedPage] = useState(initialApprovedPage);
  const [approvedPageSize, setApprovedPageSize] = useState(
    initialApprovedPageSize
  );

  // Modal state
  const [viewUser, setViewUser] = useState<InstitutionUserListItem | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userType, setUserType] = useState<"student" | "employee">("student");
  const [formError, setFormError] = useState<string | null>(null);
  
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
  
  // Form hooks
  const studentForm = useForm<StudentFormData>();
  const employeeForm = useForm<EmployeeFormData>();

  // Fetch colleges, departments, and programs when modal opens
  useEffect(() => {
    if (!isAddModalOpen) return;
    
    // Fetch student data
    setLoadingStudentColleges(true);
    fetch(`/api/public/institution/${institutionId}/colleges`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStudentColleges(data.colleges || []);
        }
      })
      .catch((err) => console.error("Failed to fetch colleges:", err))
      .finally(() => setLoadingStudentColleges(false));

    setLoadingStudentDepartments(true);
    fetch(`/api/public/institution/${institutionId}/departments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStudentDepartments(data.departments || []);
        }
      })
      .catch((err) => console.error("Failed to fetch departments:", err))
      .finally(() => setLoadingStudentDepartments(false));

    setLoadingStudentPrograms(true);
    fetch(`/api/public/institution/${institutionId}/programs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStudentPrograms(data.programs || []);
        }
      })
      .catch((err) => console.error("Failed to fetch programs:", err))
      .finally(() => setLoadingStudentPrograms(false));

    // Fetch employee data (same as student for same institution)
    setLoadingEmployeeColleges(true);
    fetch(`/api/public/institution/${institutionId}/colleges`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setEmployeeColleges(data.colleges || []);
        }
      })
      .catch((err) => console.error("Failed to fetch colleges:", err))
      .finally(() => setLoadingEmployeeColleges(false));

    setLoadingEmployeeDepartments(true);
    fetch(`/api/public/institution/${institutionId}/departments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setEmployeeDepartments(data.departments || []);
        }
      })
      .catch((err) => console.error("Failed to fetch departments:", err))
      .finally(() => setLoadingEmployeeDepartments(false));

    setLoadingEmployeePrograms(true);
    fetch(`/api/public/institution/${institutionId}/programs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setEmployeePrograms(data.programs || []);
        }
      })
      .catch((err) => console.error("Failed to fetch programs:", err))
      .finally(() => setLoadingEmployeePrograms(false));
  }, [isAddModalOpen, institutionId]);

  // Reset dependent fields when student college changes
  useEffect(() => {
    setStudentDepartmentId("");
    setStudentProgramId("");
  }, [studentCollegeId]);

  // Reset program when student department changes
  useEffect(() => {
    setStudentProgramId("");
  }, [studentDepartmentId]);

  // Reset dependent fields when employee college changes
  useEffect(() => {
    setEmployeeDepartmentId("");
    setEmployeeProgramId("");
  }, [employeeCollegeId]);

  // Reset program when employee department changes
  useEffect(() => {
    setEmployeeProgramId("");
  }, [employeeDepartmentId]);

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

  // Filter departments by selected college
  const filteredEmployeeDepartments = useMemo(() => {
    if (!employeeCollegeId) return [];
    return employeeDepartments.filter((dept) => dept.collegeId === employeeCollegeId);
  }, [employeeDepartments, employeeCollegeId]);

  // Filter programs by selected department
  const filteredEmployeePrograms = useMemo(() => {
    if (!employeeDepartmentId) return [];
    return employeePrograms.filter((prog) => prog.departmentId === employeeDepartmentId);
  }, [employeePrograms, employeeDepartmentId]);

  const handleAddStudent = async (data: StudentFormData) => {
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
          institutionId: institutionId,
          institutionSlug: institutionSlug,
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
          institutionId: institutionId,
          institutionSlug: institutionSlug,
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
      setEmployeeCollegeId("");
      setEmployeeDepartmentId("");
      setEmployeeProgramId("");
      setFormError(null);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  };

  // Update URL when filters change
  const updatePendingFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (pendingPage > 1) params.set("pendingPage", pendingPage.toString());
      if (pendingPageSize !== 10)
        params.set("pendingPageSize", pendingPageSize.toString());
      if (pendingSearch) params.set("pendingSearch", pendingSearch);
      if (pendingUserTypeFilter !== "all")
        params.set("pendingUserType", pendingUserTypeFilter);

      // Preserve approved filters
      if (approvedPage > 1) params.set("approvedPage", approvedPage.toString());
      if (approvedPageSize !== 10)
        params.set("approvedPageSize", approvedPageSize.toString());
      if (approvedSearch) params.set("approvedSearch", approvedSearch);
      if (approvedUserTypeFilter !== "all")
        params.set("approvedUserType", approvedUserTypeFilter);

      const url = params.toString()
        ? `/dashboard/institution/users?${params.toString()}`
        : "/dashboard/institution/users";
      router.push(url);
    });
  };

  const updateApprovedFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve pending filters
      if (pendingPage > 1) params.set("pendingPage", pendingPage.toString());
      if (pendingPageSize !== 10)
        params.set("pendingPageSize", pendingPageSize.toString());
      if (pendingSearch) params.set("pendingSearch", pendingSearch);
      if (pendingUserTypeFilter !== "all")
        params.set("pendingUserType", pendingUserTypeFilter);

      if (approvedPage > 1) params.set("approvedPage", approvedPage.toString());
      if (approvedPageSize !== 10)
        params.set("approvedPageSize", approvedPageSize.toString());
      if (approvedSearch) params.set("approvedSearch", approvedSearch);
      if (approvedUserTypeFilter !== "all")
        params.set("approvedUserType", approvedUserTypeFilter);

      const url = params.toString()
        ? `/dashboard/institution/users?${params.toString()}`
        : "/dashboard/institution/users";
      router.push(url);
    });
  };

  // Handle pending search
  const handlePendingSearch = (value: string) => {
    setPendingSearch(value);
    setPendingPage(1);
    setTimeout(() => updatePendingFilters(), 300);
  };

  // Handle approved search
  const handleApprovedSearch = (value: string) => {
    setApprovedSearch(value);
    setApprovedPage(1);
    setTimeout(() => updateApprovedFilters(), 300);
  };

  // Handle pending user type change
  const handlePendingUserTypeChange = (value: string) => {
    setPendingUserTypeFilter(value);
    setPendingPage(1);
    updatePendingFilters();
  };

  // Handle approved user type change
  const handleApprovedUserTypeChange = (value: string) => {
    setApprovedUserTypeFilter(value);
    setApprovedPage(1);
    updateApprovedFilters();
  };

  // Handle pending page size change
  const handlePendingPageSizeChange = (value: string) => {
    setPendingPageSize(parseInt(value, 10));
    setPendingPage(1);
    updatePendingFilters();
  };

  // Handle approved page size change
  const handleApprovedPageSizeChange = (value: string) => {
    setApprovedPageSize(parseInt(value, 10));
    setApprovedPage(1);
    updateApprovedFilters();
  };

  // Handle pending page change
  const handlePendingPageChange = (page: number) => {
    setPendingPage(page);
    updatePendingFilters();
  };

  // Handle approved page change
  const handleApprovedPageChange = (page: number) => {
    setApprovedPage(page);
    updateApprovedFilters();
  };

  // Handle view user
  const handleViewUser = (user: InstitutionUserListItem) => {
    setViewUser(user);
    setIsViewModalOpen(true);
  };

  // Handle approve user
  const handleApproveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/institution/users/${userId}/approve`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to approve user");
        return;
      }

      router.refresh();
      if (viewUser?.id === userId) {
        setIsViewModalOpen(false);
        setViewUser(null);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject user
  const handleRejectUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/institution/users/${userId}/reject`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to reject user");
        return;
      }

      router.refresh();
      if (viewUser?.id === userId) {
        setIsViewModalOpen(false);
        setViewUser(null);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle disable/enable user
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId);
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/institution/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || `Failed to ${newStatus === "active" ? "enable" : "disable"} user`);
        return;
      }

      router.refresh();
      if (viewUser?.id === userId) {
        setViewUser({ ...viewUser, status: newStatus });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : `Failed to ${newStatus === "active" ? "enable" : "disable"} user`);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper functions
  const getRoleBadge = (role: string) => {
    return role === "employee" ? "Employee" : "Student";
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const pendingTotalPages = Math.ceil(initialPendingTotal / pendingPageSize);
  const approvedTotalPages = Math.ceil(initialApprovedTotal / approvedPageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            Manage students and employees within your organization
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All users in organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Student accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Employee accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>Pending Accounts</CardTitle>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={pendingSearch}
                    onChange={(e) => handlePendingSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={pendingUserTypeFilter}
                    onValueChange={handlePendingUserTypeChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All User Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All User Types</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={pendingPageSize.toString()}
                    onValueChange={handlePendingPageSizeChange}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialPendingUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No pending users found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      initialPendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRoleBadge(user.platformRole)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveUser(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectUser(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {pendingTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pendingPage - 1) * pendingPageSize) + 1} to{" "}
                      {Math.min(pendingPage * pendingPageSize, initialPendingTotal)} of{" "}
                      {initialPendingTotal} results
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pendingPage > 1) {
                                handlePendingPageChange(pendingPage - 1);
                              }
                            }}
                            className={
                              pendingPage === 1 ? "pointer-events-none opacity-50" : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from({ length: pendingTotalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === pendingTotalPages ||
                              (page >= pendingPage - 1 && page <= pendingPage + 1)
                          )
                          .map((page, idx, arr) => (
                            <div key={page} className="flex items-center">
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2">...</span>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePendingPageChange(page);
                                  }}
                                  isActive={pendingPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pendingPage < pendingTotalPages) {
                                handlePendingPageChange(pendingPage + 1);
                              }
                            }}
                            className={
                              pendingPage === pendingTotalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Approved Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>Approved Accounts</CardTitle>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={approvedSearch}
                    onChange={(e) => handleApprovedSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={approvedUserTypeFilter}
                    onValueChange={handleApprovedUserTypeChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All User Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All User Types</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={approvedPageSize.toString()}
                    onValueChange={handleApprovedPageSizeChange}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialApprovedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No approved users found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      initialApprovedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRoleBadge(user.platformRole)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  user.status === "active" ? "destructive" : "default"
                                }
                                onClick={() =>
                                  handleToggleUserStatus(user.id, user.status)
                                }
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {approvedTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((approvedPage - 1) * approvedPageSize) + 1} to{" "}
                      {Math.min(approvedPage * approvedPageSize, initialApprovedTotal)} of{" "}
                      {initialApprovedTotal} results
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (approvedPage > 1) {
                                handleApprovedPageChange(approvedPage - 1);
                              }
                            }}
                            className={
                              approvedPage === 1 ? "pointer-events-none opacity-50" : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from({ length: approvedTotalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === approvedTotalPages ||
                              (page >= approvedPage - 1 && page <= approvedPage + 1)
                          )
                          .map((page, idx, arr) => (
                            <div key={page} className="flex items-center">
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2">...</span>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleApprovedPageChange(page);
                                  }}
                                  isActive={approvedPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (approvedPage < approvedTotalPages) {
                                handleApprovedPageChange(approvedPage + 1);
                              }
                            }}
                            className={
                              approvedPage === approvedTotalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View user information and manage account
            </DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{viewUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                </div>
                {viewUser.idNumber && (
                  <div>
                    <Label className="text-sm font-medium">ID Number</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewUser.idNumber}
                    </p>
                  </div>
                )}
                {viewUser.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewUser.phone}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">User Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {getRoleBadge(viewUser.platformRole)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant={getStatusBadgeVariant(viewUser.status)}>
                      {viewUser.status === "active" ? "Active" : "Disabled"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Member Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {viewUser.memberStatus === "approved"
                        ? "Approved"
                        : viewUser.memberStatus === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewUser && (
              <>
                {viewUser.memberStatus === "pending" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleApproveUser(viewUser.id)}
                      disabled={actionLoading === viewUser.id}
                    >
                      {actionLoading === viewUser.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectUser(viewUser.id)}
                      disabled={actionLoading === viewUser.id}
                    >
                      {actionLoading === viewUser.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant={
                        viewUser.status === "active" ? "destructive" : "default"
                      }
                      onClick={() =>
                        handleToggleUserStatus(viewUser.id, viewUser.status)
                      }
                      disabled={actionLoading === viewUser.id}
                    >
                      {actionLoading === viewUser.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : viewUser.status === "active" ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) {
          // Reset forms when modal closes
          studentForm.reset();
          employeeForm.reset();
          setStudentCollegeId("");
          setStudentDepartmentId("");
          setStudentProgramId("");
          setEmployeeCollegeId("");
          setEmployeeDepartmentId("");
          setEmployeeProgramId("");
          setFormError(null);
          setUserType("student");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Register a new student or employee account for {institutionName}.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={userType} onValueChange={(v) => {
            setUserType(v as "student" | "employee");
            setFormError(null);
          }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-6 pb-4 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="employee">Employee</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Student Form */}
            <TabsContent value="student" className="mt-0 flex-1 min-h-0 overflow-hidden flex flex-col">
              <form onSubmit={studentForm.handleSubmit(handleAddStudent)} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="px-6 py-4">
                    <div className="space-y-4">
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
                      <Input
                        id="student-institution"
                        value={institutionName}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="student-college">
                        College <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={studentCollegeId}
                        onValueChange={setStudentCollegeId}
                        disabled={loadingStudentColleges || studentColleges.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingStudentColleges ? "Loading colleges..." : studentColleges.length === 0 ? "No colleges available" : "Select College..."} />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
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
                      {!loadingStudentColleges && studentColleges.length === 0 && (
                        <p className="text-xs text-amber-600">
                          No colleges are available for this institution. Please add colleges in the institution settings.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                      <div className="grid gap-2 min-w-0 max-w-full">
                        <Label htmlFor="student-department">
                          Department <span className="text-red-600">*</span>
                        </Label>
                        <div className="w-full min-w-0">
                          <Select
                            value={studentDepartmentId}
                            onValueChange={setStudentDepartmentId}
                            disabled={!studentCollegeId || loadingStudentDepartments || filteredStudentDepartments.length === 0}
                          >
                            <SelectTrigger className="w-full max-w-full overflow-hidden">
                              <SelectValue placeholder={loadingStudentDepartments ? "Loading departments..." : !studentCollegeId ? "Select college first" : filteredStudentDepartments.length === 0 ? "No departments available" : "Select Department..."} className="truncate block min-w-0" />
                            </SelectTrigger>
                          <SelectContent className="z-[100]">
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
                        </div>
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
                      <div className="grid gap-2 min-w-0 max-w-full">
                        <Label htmlFor="student-program">
                          Program <span className="text-red-600">*</span>
                        </Label>
                        <div className="w-full min-w-0">
                          <Select
                            value={studentProgramId}
                            onValueChange={setStudentProgramId}
                            disabled={!studentDepartmentId || loadingStudentPrograms || filteredStudentPrograms.length === 0}
                          >
                            <SelectTrigger className="w-full max-w-full overflow-hidden">
                              <SelectValue placeholder={loadingStudentPrograms ? "Loading programs..." : !studentDepartmentId ? "Select department first" : filteredStudentPrograms.length === 0 ? "No programs available" : "Select Program..."} className="truncate block min-w-0" />
                            </SelectTrigger>
                          <SelectContent className="z-[100]">
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
                        </div>
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
                  </div>
                </div>
                <DialogFooter className="px-6 pt-4 pb-6 flex-shrink-0 border-t bg-background sticky bottom-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      studentForm.reset();
                      setFormError(null);
                    }}
                    disabled={studentForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={studentForm.formState.isSubmitting}
                  >
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
            <TabsContent value="employee" className="mt-0 flex-1 min-h-0 overflow-hidden flex flex-col">
              <form onSubmit={employeeForm.handleSubmit(handleAddEmployee)} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="px-6 py-4">
                    <div className="space-y-4">
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
                      <Input
                        id="employee-institution"
                        value={institutionName}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="employee-college">
                        College <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={employeeCollegeId}
                        onValueChange={setEmployeeCollegeId}
                        disabled={loadingEmployeeColleges || employeeColleges.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingEmployeeColleges ? "Loading colleges..." : employeeColleges.length === 0 ? "No colleges available" : "Select College..."} />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
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
                      {!loadingEmployeeColleges && employeeColleges.length === 0 && (
                        <p className="text-xs text-amber-600">
                          No colleges are available for this institution. Please add colleges in the institution settings.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                      <div className="grid gap-2 min-w-0 max-w-full">
                        <Label htmlFor="employee-department">
                          Department <span className="text-red-600">*</span>
                        </Label>
                        <div className="w-full min-w-0">
                          <Select
                            value={employeeDepartmentId}
                            onValueChange={setEmployeeDepartmentId}
                            disabled={!employeeCollegeId || loadingEmployeeDepartments || filteredEmployeeDepartments.length === 0}
                          >
                            <SelectTrigger className="w-full max-w-full overflow-hidden">
                              <SelectValue placeholder={loadingEmployeeDepartments ? "Loading departments..." : !employeeCollegeId ? "Select college first" : filteredEmployeeDepartments.length === 0 ? "No departments available" : "Select Department..."} className="truncate block min-w-0" />
                            </SelectTrigger>
                          <SelectContent className="z-[100]">
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
                        </div>
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
                      <div className="grid gap-2 min-w-0 max-w-full">
                        <Label htmlFor="employee-program">
                          Program <span className="text-red-600">*</span>
                        </Label>
                        <div className="w-full min-w-0">
                          <Select
                            value={employeeProgramId}
                            onValueChange={setEmployeeProgramId}
                            disabled={!employeeDepartmentId || loadingEmployeePrograms || filteredEmployeePrograms.length === 0}
                          >
                            <SelectTrigger className="w-full max-w-full overflow-hidden">
                              <SelectValue placeholder={loadingEmployeePrograms ? "Loading programs..." : !employeeDepartmentId ? "Select department first" : filteredEmployeePrograms.length === 0 ? "No programs available" : "Select Program..."} className="truncate block min-w-0" />
                            </SelectTrigger>
                          <SelectContent className="z-[100]">
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
                        </div>
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
                  </div>
                </div>
                <DialogFooter className="px-6 pt-4 pb-6 flex-shrink-0 border-t bg-background sticky bottom-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      employeeForm.reset();
                      setFormError(null);
                    }}
                    disabled={employeeForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={employeeForm.formState.isSubmitting}
                  >
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

