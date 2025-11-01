"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Landmark,
  Clock,
  XCircle,
  Search,
  CheckCircle2,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import type { InstitutionStats, InstitutionListItem } from "@/lib/repos/institution";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface InstitutionFormData {
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  webDomain?: string;
  contactPersonEmail: string;
  password: string;
  confirmPassword: string;
}

export interface AdminInstitutionsPageProps {
  stats: InstitutionStats;
  institutions: InstitutionListItem[];
  initialStatus: string;
  initialSearch: string;
}

export function AdminInstitutionsPage({
  stats,
  institutions: initialInstitutions,
  initialStatus,
  initialSearch,
}: AdminInstitutionsPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InstitutionFormData>();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (value) params.set("search", value);
      router.push(`/dashboard/admin/institutions?${params.toString()}`);
    });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value && value !== "all") params.set("status", value);
      if (searchQuery) params.set("search", searchQuery);
      router.push(`/dashboard/admin/institutions?${params.toString()}`);
    });
  };

  const onSubmitAddInstitution = async (data: InstitutionFormData) => {
    if (data.password !== data.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          idNumber: data.idNumber,
          email: data.email,
          phone: data.phone,
          webDomain: data.webDomain || null,
          contactPersonEmail: data.contactPersonEmail,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to create institution");
      }

      // Close modal and refresh
      setIsAddModalOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create institution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (
    institutionId: string,
    action: "approve" | "reject"
  ) => {
    setActionLoading(institutionId);
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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
    switch (status.toLowerCase()) {
      case "approved":
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Institution Management
          </h1>
          <p className="text-muted-foreground">
            Manage and approve institution registrations
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Institution
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Institutions
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registered}</div>
            <p className="text-xs text-muted-foreground">
              Active and approved institutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected Institutions
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Rejected registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Institution List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search institutions..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Institution Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialInstitutions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No institutions found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  initialInstitutions.map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={institution.logo}
                            alt={institution.name}
                          />
                          <AvatarFallback>
                            {institution.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {institution.name}
                      </TableCell>
                      <TableCell>{institution.contactPersonEmail}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(institution.status)}>
                          {institution.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleAction(institution.id, "approve")
                            }
                            disabled={
                              actionLoading === institution.id ||
                              institution.status === "approved" ||
                              institution.status === "active"
                            }
                          >
                            {actionLoading === institution.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleAction(institution.id, "reject")
                            }
                            disabled={
                              actionLoading === institution.id ||
                              institution.status === "rejected"
                            }
                          >
                            {actionLoading === institution.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Reject
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
          )}
        </CardContent>
      </Card>

      {/* Add Institution Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Institution</DialogTitle>
            <DialogDescription>
              Create a new institution. It will be automatically approved.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAddInstitution)}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Institution Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Partido State University"
                    {...register("name", { required: "Institution name is required" })}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="idNumber">
                    School ID <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="idNumber"
                    placeholder="SCHOOL-ID-12345"
                    {...register("idNumber", { required: "School ID is required" })}
                  />
                  {errors.idNumber && (
                    <p className="text-xs text-red-600">{errors.idNumber.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parsu@example.com"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="09xx-xxx-xxxx"
                    {...register("phone", { required: "Phone is required" })}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="webDomain">Website Domain</Label>
                  <Input
                    id="webDomain"
                    placeholder="parsu.edu.ph"
                    {...register("webDomain")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contactPersonEmail">
                    Contact Person Email <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    placeholder="janesmith@example.com"
                    {...register("contactPersonEmail", {
                      required: "Contact Person Email is required",
                    })}
                  />
                  {errors.contactPersonEmail && (
                    <p className="text-xs text-red-600">
                      {errors.contactPersonEmail.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", { required: "Password is required" })}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === watch("password") || "Passwords do not match",
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">
                      {errors.confirmPassword.message}
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
                  reset();
                  setFormError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Institution"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

