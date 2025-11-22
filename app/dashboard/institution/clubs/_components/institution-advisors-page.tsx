"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Users,
  UserCheck,
  Search,
  Loader2,
  Eye,
  UserPlus,
  UserMinus,
  Trash2,
} from "lucide-react";
import type {
  InstitutionAdvisorStats,
  InstitutionClubListItem,
  InstitutionEmployeeListItem,
} from "@/lib/repos/institution";

export interface InstitutionAdvisorsPageProps {
  stats: InstitutionAdvisorStats;
  clubs: InstitutionClubListItem[];
  initialSearch: string;
  initialAdvisorStatus: string;
}

export function InstitutionAdvisorsPage({
  stats,
  clubs: initialClubs,
  initialSearch,
  initialAdvisorStatus,
}: InstitutionAdvisorsPageProps) {
  const router = useRouter();

  // Filters state
  const [search, setSearch] = useState(initialSearch);
  const [advisorStatus, setAdvisorStatus] = useState(initialAdvisorStatus);

  // Modal state
  const [selectedClub, setSelectedClub] =
    useState<InstitutionClubListItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [unassignClub, setUnassignClub] =
    useState<InstitutionClubListItem | null>(null);
  const [viewClub, setViewClub] = useState<InstitutionClubListItem | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteClub, setDeleteClub] = useState<InstitutionClubListItem | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Employee list for assign modal
  const [employees, setEmployees] = useState<InstitutionEmployeeListItem[]>([]);
  const [employeesSearch, setEmployeesSearch] = useState("");
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Update URL when filters change
  const updateFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (advisorStatus && advisorStatus !== "all")
        params.set("advisorStatus", advisorStatus);

      const url = params.toString()
        ? `/dashboard/institution/clubs?${params.toString()}`
        : "/dashboard/institution/clubs";
      router.push(url);
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => updateFilters(), 300);
  };

  // Handle advisor status change
  const handleAdvisorStatusChange = (value: string) => {
    setAdvisorStatus(value);
    updateFilters();
  };

  // Handle view club
  const handleViewClub = (club: InstitutionClubListItem) => {
    setViewClub(club);
    setIsViewModalOpen(true);
  };

  // Handle assign advisor - open modal and fetch employees
  const handleAssignAdvisor = async (club: InstitutionClubListItem) => {
    setSelectedClub(club);
    setIsAssignModalOpen(true);
    setIsLoadingEmployees(true);

    try {
      // Fetch employees who are not advisors for this club
      const res = await fetch(
        `/api/institution/clubs/${
          club.clubId
        }/employees?search=${encodeURIComponent(employeesSearch)}`
      );
      const data = await res.json();

      if (res.ok && data?.employees) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
      }
    } catch (e) {
      console.error("Failed to fetch employees:", e);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Handle employee search in modal
  const handleEmployeeSearch = async (value: string) => {
    setEmployeesSearch(value);
    if (!selectedClub) return;

    setIsLoadingEmployees(true);
    try {
      const res = await fetch(
        `/api/institution/clubs/${
          selectedClub.clubId
        }/employees?search=${encodeURIComponent(value)}`
      );
      const data = await res.json();

      if (res.ok && data?.employees) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
      }
    } catch (e) {
      console.error("Failed to fetch employees:", e);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Handle assign employee as advisor
  const handleAssignEmployee = async (employeeId: string) => {
    if (!selectedClub) return;

    setActionLoading(employeeId);
    try {
      const res = await fetch(
        `/api/institution/clubs/${selectedClub.clubId}/advisors/${employeeId}/assign`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to assign advisor");
        return;
      }

      // Close modal and refresh
      setIsAssignModalOpen(false);
      setSelectedClub(null);
      setEmployeesSearch("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to assign advisor");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle unassign advisor - open confirmation modal
  const handleUnassignAdvisor = (club: InstitutionClubListItem) => {
    if (!club.hasAdvisor || !club.clubId) return;
    setUnassignClub(club);
    setIsUnassignModalOpen(true);
  };

  // Confirm and execute unassign advisor
  const confirmUnassignAdvisor = async () => {
    if (!unassignClub || !unassignClub.clubId) return;

    setActionLoading(unassignClub.clubId);
    try {
      const res = await fetch(
        `/api/institution/clubs/${unassignClub.clubId}/advisors/unassign`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to unassign advisor");
        return;
      }

      // Close modal and refresh the page
      setIsUnassignModalOpen(false);
      setUnassignClub(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to unassign advisor");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete club - open confirmation modal
  const handleDeleteClub = (club: InstitutionClubListItem) => {
    setDeleteClub(club);
    setIsDeleteModalOpen(true);
  };

  // Confirm and execute delete club
  const confirmDeleteClub = async () => {
    if (!deleteClub || !deleteClub.clubId) return;

    setActionLoading(deleteClub.clubId);
    try {
      const res = await fetch(`/api/institution/clubs/${deleteClub.clubId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to delete club");
        return;
      }

      // Close modal and refresh the page
      setIsDeleteModalOpen(false);
      setDeleteClub(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete club");
    } finally {
      setActionLoading(null);
    }
  };

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Advisors Management
        </h1>
        <p className="text-muted-foreground">
          Manage employee advisors for clubs within your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              Assigned Advisors
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdvisors}</div>
            <p className="text-xs text-muted-foreground">
              Employees assigned as advisors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clubs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Approved Clubs</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by acronym, club name, email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={advisorStatus}
                onValueChange={handleAdvisorStatusChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="no_advisor">No Adviser</SelectItem>
                  <SelectItem value="has_advisor">Has Adviser</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Acronym</TableHead>
                  <TableHead>Club Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialClubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No clubs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  initialClubs.map((club) => (
                    <TableRow key={club.clubId}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={club.logo} alt={club.clubName} />
                          <AvatarFallback>
                            {club.acronym
                              ? club.acronym.toUpperCase().slice(0, 2)
                              : getInitials(club.clubName)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {club.acronym || "-"}
                      </TableCell>
                      <TableCell>{club.clubName}</TableCell>
                      <TableCell>{club.email || "-"}</TableCell>
                      <TableCell>{club.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={club.hasAdvisor ? "default" : "secondary"}
                        >
                          {club.hasAdvisor ? "Has Adviser" : "No Adviser"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClub(club)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {club.hasAdvisor ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUnassignAdvisor(club)}
                              disabled={actionLoading === club.clubId}
                            >
                              {actionLoading === club.clubId ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4 mr-1" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAssignAdvisor(club)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClub(club)}
                            disabled={actionLoading === club.clubId}
                          >
                            {actionLoading === club.clubId ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}{" "}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Club Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Club Details</DialogTitle>
            <DialogDescription>
              View club information and advisor status
            </DialogDescription>
          </DialogHeader>
          {viewClub && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewClub.logo} alt={viewClub.clubName} />
                  <AvatarFallback>
                    {viewClub.acronym
                      ? viewClub.acronym.toUpperCase().slice(0, 2)
                      : getInitials(viewClub.clubName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{viewClub.clubName}</h3>
                  {viewClub.acronym && (
                    <p className="text-sm text-muted-foreground">
                      {viewClub.acronym}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {viewClub.email && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewClub.email}
                    </p>
                  </div>
                )}
                {viewClub.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewClub.phone}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Advisor Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge
                      variant={viewClub.hasAdvisor ? "default" : "secondary"}
                    >
                      {viewClub.hasAdvisor ? "Has Adviser" : "No Adviser"}
                    </Badge>
                  </p>
                </div>
                {viewClub.hasAdvisor && viewClub.advisorName && (
                  <div>
                    <Label className="text-sm font-medium">Advisor Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewClub.advisorName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            {viewClub && viewClub.hasAdvisor && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleUnassignAdvisor(viewClub);
                }}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Unassign Adviser
              </Button>
            )}
            {viewClub && !viewClub.hasAdvisor && (
              <Button
                variant="default"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleAssignAdvisor(viewClub);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign an Adviser
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Advisor Modal */}
      <Dialog
        open={isAssignModalOpen}
        onOpenChange={(open) => {
          setIsAssignModalOpen(open);
          if (!open) {
            setSelectedClub(null);
            setEmployeesSearch("");
            setEmployees([]);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Adviser</DialogTitle>
            <DialogDescription>
              Select an employee to assign as adviser for{" "}
              {selectedClub?.clubName}
            </DialogDescription>
          </DialogHeader>
          {selectedClub && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Search Filter */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={employeesSearch}
                  onChange={(e) => handleEmployeeSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Employees List */}
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No available employees found
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                  <div className="overflow-y-auto flex-1">
                    <div className="[&_[data-slot='table-container']]:!overflow-x-visible [&_[data-slot='table-container']]:!overflow-y-visible [&_[data-slot='table-container']]:!w-full">
                      <Table className="table-fixed w-full">
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-[70px]">Profile</TableHead>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead className="w-[220px]">Email</TableHead>
                            <TableHead className="w-[140px]">Phone</TableHead>
                            <TableHead className="w-[120px] text-right">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="w-[70px]">
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
                              <TableCell className="font-medium w-[200px]">
                                <div className="truncate" title={employee.name}>
                                  {employee.name}
                                </div>
                              </TableCell>
                              <TableCell className="w-[220px]">
                                <div
                                  className="truncate"
                                  title={employee.email}
                                >
                                  {employee.email}
                                </div>
                              </TableCell>
                              <TableCell className="w-[140px]">
                                <div
                                  className="truncate"
                                  title={employee.phone || "-"}
                                >
                                  {employee.phone || "-"}
                                </div>
                              </TableCell>
                              <TableCell className="w-[120px] text-right">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    handleAssignEmployee(employee.id)
                                  }
                                  disabled={actionLoading === employee.id}
                                >
                                  {actionLoading === employee.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      Assign
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedClub(null);
                setEmployeesSearch("");
                setEmployees([]);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Advisor Confirmation Modal */}
      <Dialog
        open={isUnassignModalOpen}
        onOpenChange={(open) => {
          setIsUnassignModalOpen(open);
          if (!open) {
            setUnassignClub(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Adviser</DialogTitle>
            <DialogDescription>
              Are you sure you want to unassign the adviser from{" "}
              <strong>{unassignClub?.clubName}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {unassignClub && unassignClub.hasAdvisor && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Club</Label>
                  <p className="text-sm text-muted-foreground">
                    {unassignClub.clubName}
                  </p>
                </div>
                {unassignClub.advisorName && (
                  <div>
                    <Label className="text-sm font-medium">
                      Current Adviser
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {unassignClub.advisorName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUnassignModalOpen(false);
                setUnassignClub(null);
              }}
              disabled={actionLoading === unassignClub?.clubId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUnassignAdvisor}
              disabled={actionLoading === unassignClub?.clubId}
            >
              {actionLoading === unassignClub?.clubId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unassigning...
                </>
              ) : (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                </>
              )}{" "}
              Unassign Adviser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Club Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setDeleteClub(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteClub?.clubName}</strong>? This action cannot be
              undone and will permanently delete the club and all associated
              data.
            </DialogDescription>
          </DialogHeader>
          {deleteClub && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Club Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {deleteClub.clubName}
                  </p>
                </div>
                {deleteClub.acronym && (
                  <div>
                    <Label className="text-sm font-medium">Acronym</Label>
                    <p className="text-sm text-muted-foreground">
                      {deleteClub.acronym}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteClub(null);
              }}
              disabled={actionLoading === deleteClub?.clubId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteClub}
              disabled={actionLoading === deleteClub?.clubId}
            >
              {actionLoading === deleteClub?.clubId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Club
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
