"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  Search,
  Loader2,
  Eye,
  UserPlus,
  UserMinus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type {
  InstitutionStaffStats,
  InstitutionEmployeeListItem,
} from "@/lib/repos/institution";

export interface InstitutionStaffsPageProps {
  stats: InstitutionStaffStats;
  employees: InstitutionEmployeeListItem[];
  employeesTotal: number;
  employeesPage: number;
  employeesPageSize: number;
  employeesSearch: string;
  employeesSortBy: "name" | "email";
  employeesSortOrder: "asc" | "desc";
  staffs: InstitutionEmployeeListItem[];
  staffsTotal: number;
  staffsPage: number;
  staffsPageSize: number;
  staffsSearch: string;
  staffsSortBy: "name" | "email";
  staffsSortOrder: "asc" | "desc";
}

export function InstitutionStaffsPage({
  stats,
  employees: initialEmployees,
  employeesTotal: initialEmployeesTotal,
  employeesPage: initialEmployeesPage,
  employeesPageSize: initialEmployeesPageSize,
  employeesSearch: initialEmployeesSearch,
  employeesSortBy: initialEmployeesSortBy,
  employeesSortOrder: initialEmployeesSortOrder,
  staffs: initialStaffs,
  staffsTotal: initialStaffsTotal,
  staffsPage: initialStaffsPage,
  staffsPageSize: initialStaffsPageSize,
  staffsSearch: initialStaffsSearch,
  staffsSortBy: initialStaffsSortBy,
  staffsSortOrder: initialStaffsSortOrder,
}: InstitutionStaffsPageProps) {
  const router = useRouter();

  // Employees state
  const [employeesSearch, setEmployeesSearch] = useState(initialEmployeesSearch);
  const [employeesPage, setEmployeesPage] = useState(initialEmployeesPage);
  const [employeesPageSize, setEmployeesPageSize] = useState(
    initialEmployeesPageSize
  );
  const [employeesSortBy, setEmployeesSortBy] = useState(initialEmployeesSortBy);
  const [employeesSortOrder, setEmployeesSortOrder] = useState(
    initialEmployeesSortOrder
  );

  // Staffs state
  const [staffsSearch, setStaffsSearch] = useState(initialStaffsSearch);
  const [staffsPage, setStaffsPage] = useState(initialStaffsPage);
  const [staffsPageSize, setStaffsPageSize] = useState(initialStaffsPageSize);
  const [staffsSortBy, setStaffsSortBy] = useState(initialStaffsSortBy);
  const [staffsSortOrder, setStaffsSortOrder] = useState(initialStaffsSortOrder);

  // Modal state
  const [viewEmployee, setViewEmployee] =
    useState<InstitutionEmployeeListItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Update URL when filters change
  const updateEmployeesFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (employeesPage > 1)
        params.set("employeesPage", employeesPage.toString());
      if (employeesPageSize !== 10)
        params.set("employeesPageSize", employeesPageSize.toString());
      if (employeesSearch) params.set("employeesSearch", employeesSearch);
      if (employeesSortBy !== "name")
        params.set("employeesSortBy", employeesSortBy);
      if (employeesSortOrder !== "asc")
        params.set("employeesSortOrder", employeesSortOrder);

      // Preserve staffs filters
      if (staffsPage > 1) params.set("staffsPage", staffsPage.toString());
      if (staffsPageSize !== 10)
        params.set("staffsPageSize", staffsPageSize.toString());
      if (staffsSearch) params.set("staffsSearch", staffsSearch);
      if (staffsSortBy !== "name") params.set("staffsSortBy", staffsSortBy);
      if (staffsSortOrder !== "asc")
        params.set("staffsSortOrder", staffsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/staffs?${params.toString()}`
        : "/dashboard/institution/staffs";
      router.push(url);
    });
  };

  const updateStaffsFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve employees filters
      if (employeesPage > 1)
        params.set("employeesPage", employeesPage.toString());
      if (employeesPageSize !== 10)
        params.set("employeesPageSize", employeesPageSize.toString());
      if (employeesSearch) params.set("employeesSearch", employeesSearch);
      if (employeesSortBy !== "name")
        params.set("employeesSortBy", employeesSortBy);
      if (employeesSortOrder !== "asc")
        params.set("employeesSortOrder", employeesSortOrder);

      if (staffsPage > 1) params.set("staffsPage", staffsPage.toString());
      if (staffsPageSize !== 10)
        params.set("staffsPageSize", staffsPageSize.toString());
      if (staffsSearch) params.set("staffsSearch", staffsSearch);
      if (staffsSortBy !== "name") params.set("staffsSortBy", staffsSortBy);
      if (staffsSortOrder !== "asc")
        params.set("staffsSortOrder", staffsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/staffs?${params.toString()}`
        : "/dashboard/institution/staffs";
      router.push(url);
    });
  };

  // Handle employees search
  const handleEmployeesSearch = (value: string) => {
    setEmployeesSearch(value);
    setEmployeesPage(1);
    setTimeout(() => updateEmployeesFilters(), 300);
  };

  // Handle staffs search
  const handleStaffsSearch = (value: string) => {
    setStaffsSearch(value);
    setStaffsPage(1);
    setTimeout(() => updateStaffsFilters(), 300);
  };

  // Handle employees sort
  const handleEmployeesSort = () => {
    const newOrder = employeesSortOrder === "asc" ? "desc" : "asc";
    setEmployeesSortOrder(newOrder);
    setEmployeesPage(1);
    // Update immediately
    startTransition(() => {
      const params = new URLSearchParams();
      if (employeesPage > 1)
        params.set("employeesPage", "1");
      if (employeesPageSize !== 10)
        params.set("employeesPageSize", employeesPageSize.toString());
      if (employeesSearch) params.set("employeesSearch", employeesSearch);
      params.set("employeesSortBy", "name");
      params.set("employeesSortOrder", newOrder);

      // Preserve staffs filters
      if (staffsPage > 1) params.set("staffsPage", staffsPage.toString());
      if (staffsPageSize !== 10)
        params.set("staffsPageSize", staffsPageSize.toString());
      if (staffsSearch) params.set("staffsSearch", staffsSearch);
      if (staffsSortBy !== "name") params.set("staffsSortBy", staffsSortBy);
      if (staffsSortOrder !== "asc")
        params.set("staffsSortOrder", staffsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/staffs?${params.toString()}`
        : "/dashboard/institution/staffs";
      router.push(url);
    });
  };

  // Handle staffs sort
  const handleStaffsSort = () => {
    const newOrder = staffsSortOrder === "asc" ? "desc" : "asc";
    setStaffsSortOrder(newOrder);
    setStaffsPage(1);
    // Update immediately
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve employees filters
      if (employeesPage > 1)
        params.set("employeesPage", employeesPage.toString());
      if (employeesPageSize !== 10)
        params.set("employeesPageSize", employeesPageSize.toString());
      if (employeesSearch) params.set("employeesSearch", employeesSearch);
      if (employeesSortBy !== "name")
        params.set("employeesSortBy", employeesSortBy);
      if (employeesSortOrder !== "asc")
        params.set("employeesSortOrder", employeesSortOrder);

      if (staffsPage > 1) params.set("staffsPage", "1");
      if (staffsPageSize !== 10)
        params.set("staffsPageSize", staffsPageSize.toString());
      if (staffsSearch) params.set("staffsSearch", staffsSearch);
      params.set("staffsSortBy", "name");
      params.set("staffsSortOrder", newOrder);

      const url = params.toString()
        ? `/dashboard/institution/staffs?${params.toString()}`
        : "/dashboard/institution/staffs";
      router.push(url);
    });
  };

  // Handle employees page size change
  const handleEmployeesPageSizeChange = (value: string) => {
    setEmployeesPageSize(parseInt(value, 10));
    setEmployeesPage(1);
    updateEmployeesFilters();
  };

  // Handle staffs page size change
  const handleStaffsPageSizeChange = (value: string) => {
    setStaffsPageSize(parseInt(value, 10));
    setStaffsPage(1);
    updateStaffsFilters();
  };

  // Handle employees page change
  const handleEmployeesPageChange = (page: number) => {
    setEmployeesPage(page);
    updateEmployeesFilters();
  };

  // Handle staffs page change
  const handleStaffsPageChange = (page: number) => {
    setStaffsPage(page);
    updateStaffsFilters();
  };

  // Handle view employee
  const handleViewEmployee = (employee: InstitutionEmployeeListItem) => {
    setViewEmployee(employee);
    setIsViewModalOpen(true);
  };

  // Handle assign as staff
  const handleAssignStaff = async (employeeId: string) => {
    setActionLoading(employeeId);
    try {
      const res = await fetch(`/api/institution/staffs/${employeeId}/assign`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to assign staff");
        return;
      }

      router.refresh();
      if (viewEmployee?.id === employeeId) {
        setIsViewModalOpen(false);
        setViewEmployee(null);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to assign staff");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle remove staff
  const handleRemoveStaff = async (staffId: string) => {
    setActionLoading(staffId);
    try {
      const res = await fetch(`/api/institution/staffs/${staffId}/remove`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to remove staff");
        return;
      }

      router.refresh();
      if (viewEmployee?.id === staffId) {
        setIsViewModalOpen(false);
        setViewEmployee(null);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove staff");
    } finally {
      setActionLoading(null);
    }
  };

  const employeesTotalPages = Math.ceil(
    initialEmployeesTotal / employeesPageSize
  );
  const staffsTotalPages = Math.ceil(initialStaffsTotal / staffsPageSize);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staffs Management</h1>
        <p className="text-muted-foreground">
          Manage staff assignments within your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              All employees in organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staffs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaffs}</div>
            <p className="text-xs text-muted-foreground">
              Employees assigned as staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Approved Employees Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>Approved Employees</CardTitle>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone..."
                    value={employeesSearch}
                    onChange={(e) => handleEmployeesSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={employeesPageSize.toString()}
                  onValueChange={handleEmployeesPageSizeChange}
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
                      <TableHead>Profile</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={handleEmployeesSort}
                        >
                          Name
                          {employeesSortBy === "name" ? (
                            employeesSortOrder === "asc" ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No employees found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      initialEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={employee.avatarUrl}
                                alt={employee.name}
                              />
                              <AvatarFallback>
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Employee</Badge>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.phone || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewEmployee(employee)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAssignStaff(employee.id)}
                                disabled={actionLoading === employee.id}
                              >
                                {actionLoading === employee.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Assign as Staff
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
                {employeesTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      {(employeesPage - 1) * employeesPageSize + 1} to{" "}
                      {Math.min(
                        employeesPage * employeesPageSize,
                        initialEmployeesTotal
                      )}{" "}
                      of {initialEmployeesTotal} results
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (employeesPage > 1) {
                                handleEmployeesPageChange(employeesPage - 1);
                              }
                            }}
                            className={
                              employeesPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: employeesTotalPages },
                          (_, i) => i + 1
                        )
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === employeesTotalPages ||
                              (page >= employeesPage - 1 &&
                                page <= employeesPage + 1)
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
                                    handleEmployeesPageChange(page);
                                  }}
                                  isActive={employeesPage === page}
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
                              if (employeesPage < employeesTotalPages) {
                                handleEmployeesPageChange(employeesPage + 1);
                              }
                            }}
                            className={
                              employeesPage === employeesTotalPages
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

        {/* Assigned Staffs Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>Assigned Staffs</CardTitle>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone..."
                    value={staffsSearch}
                    onChange={(e) => handleStaffsSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={staffsPageSize.toString()}
                  onValueChange={handleStaffsPageSizeChange}
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
                      <TableHead>Profile</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={handleStaffsSort}
                        >
                          Name
                          {staffsSortBy === "name" ? (
                            staffsSortOrder === "asc" ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialStaffs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No staffs found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      initialStaffs.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={staff.avatarUrl}
                                alt={staff.name}
                              />
                              <AvatarFallback>
                                {getInitials(staff.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {staff.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Employee</Badge>
                          </TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>{staff.phone || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewEmployee(staff)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveStaff(staff.id)}
                                disabled={actionLoading === staff.id}
                              >
                                {actionLoading === staff.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    Remove Staff
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
                {staffsTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {(staffsPage - 1) * staffsPageSize + 1} to{" "}
                      {Math.min(
                        staffsPage * staffsPageSize,
                        initialStaffsTotal
                      )}{" "}
                      of {initialStaffsTotal} results
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (staffsPage > 1) {
                                handleStaffsPageChange(staffsPage - 1);
                              }
                            }}
                            className={
                              staffsPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from({ length: staffsTotalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === staffsTotalPages ||
                              (page >= staffsPage - 1 && page <= staffsPage + 1)
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
                                    handleStaffsPageChange(page);
                                  }}
                                  isActive={staffsPage === page}
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
                              if (staffsPage < staffsTotalPages) {
                                handleStaffsPageChange(staffsPage + 1);
                              }
                            }}
                            className={
                              staffsPage === staffsTotalPages
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

      {/* View Employee Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>
              View employee information and manage staff assignment
            </DialogDescription>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={viewEmployee.avatarUrl}
                    alt={viewEmployee.name}
                  />
                  <AvatarFallback>
                    {getInitials(viewEmployee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewEmployee.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {viewEmployee.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEmployee.email}
                  </p>
                </div>
                {viewEmployee.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewEmployee.phone}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">User Type</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="outline">Employee</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge
                      variant={
                        viewEmployee.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {viewEmployee.status === "active" ? "Active" : "Disabled"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Staff Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant={viewEmployee.isStaff ? "default" : "outline"}>
                      {viewEmployee.isStaff ? "Staff" : "Regular Employee"}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewEmployee && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                {viewEmployee.isStaff ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveStaff(viewEmployee.id)}
                    disabled={actionLoading === viewEmployee.id}
                  >
                    {actionLoading === viewEmployee.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Staff
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => handleAssignStaff(viewEmployee.id)}
                    disabled={actionLoading === viewEmployee.id}
                  >
                    {actionLoading === viewEmployee.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign as Staff
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

