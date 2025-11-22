"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
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
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Eye,
} from "lucide-react";
import type {
  AdminClubStats,
  AdminClubListItem,
} from "@/lib/repos/admin-clubs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ClubFormData {
  clubName: string;
  clubAcr: string;
  email: string;
  phone: string;
  about: string;
  institutionId: string;
}

export interface AdminClubsPageProps {
  stats: AdminClubStats;
  clubs: AdminClubListItem[];
  institutions: Array<{ id: string; name: string }>;
  initialStatus: string;
  initialSearch: string;
  initialInstitution: string;
}

export function AdminClubsPage({
  stats,
  clubs: initialClubs,
  institutions,
  initialStatus,
  initialSearch,
  initialInstitution,
}: AdminClubsPageProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [institutionFilter, setInstitutionFilter] =
    useState(initialInstitution);
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewClub, setViewClub] = useState<AdminClubListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ClubFormData>();

  // Preview logo from file
  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return "";
  }, [logoFile]);

  // Cleanup object URL on unmount or when logoFile changes
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFormError("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Image file size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setFormError(null);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value && value !== "all") params.set("status", value);
      if (searchQuery) params.set("search", searchQuery);
      if (institutionFilter && institutionFilter !== "all")
        params.set("institution", institutionFilter);
      router.push(`/dashboard/admin/clubs?${params.toString()}`);
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      if (value) params.set("search", value);
      if (institutionFilter && institutionFilter !== "all")
        params.set("institution", institutionFilter);
      router.push(`/dashboard/admin/clubs?${params.toString()}`);
    });
  };

  const handleInstitutionChange = (value: string) => {
    setInstitutionFilter(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (value && value !== "all") params.set("institution", value);
      router.push(`/dashboard/admin/clubs?${params.toString()}`);
    });
  };

  const handleAction = async (
    clubId: string,
    action: "approve" | "suspend"
  ) => {
    setActionLoading(clubId);

    try {
      const res = await fetch(`/api/admin/clubs/${clubId}/status`, {
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

  const onSubmitAddClub = async (data: ClubFormData) => {
    if (!logoFile) {
      setFormError("Please select a logo file");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("logo", logoFile);
      formData.append("clubName", data.clubName);
      formData.append("clubAcr", data.clubAcr);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      if (data.about) {
        formData.append("about", data.about);
      }
      formData.append("institutionId", data.institutionId);

      const res = await fetch("/api/admin/clubs", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to create club");
      }

      // Close modal and refresh
      setIsAddModalOpen(false);
      reset();
      setLogoFile(null);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create club"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Handle view club
  const handleViewClub = (club: AdminClubListItem) => {
    setViewClub(club);
    setIsViewModalOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Clubs & Organizations
          </h1>
          <p className="text-muted-foreground">
            Manage clubs and organizations across institutions
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Club
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Clubs
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedClubs}</div>
            <p className="text-xs text-muted-foreground">
              Currently active clubs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clubs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClubs}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suspended Clubs
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspendedClubs}</div>
            <p className="text-xs text-muted-foreground">Suspended clubs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Clubs List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search club name or acronym..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Institution Filter */}
              <Select
                value={institutionFilter}
                onValueChange={handleInstitutionChange}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Institutions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
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
                  <TableHead>Club Name</TableHead>
                  <TableHead>Acronym</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialClubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
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
                            {club.clubName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {club.clubName}
                      </TableCell>
                      <TableCell>
                        {club.clubAcr ? (
                          <Badge variant="outline">{club.clubAcr}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{club.institutionName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(club.status)}>
                          {club.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClub(club)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAction(club.clubId, "approve")}
                            disabled={
                              actionLoading === club.clubId ||
                              club.status === "approved"
                            }
                          >
                            {actionLoading === club.clubId ? (
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
                            onClick={() => handleAction(club.clubId, "suspend")}
                            disabled={
                              actionLoading === club.clubId ||
                              club.status === "suspended"
                            }
                          >
                            {actionLoading === club.clubId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Suspend
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

      {/* Add Club Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Club</DialogTitle>
            <DialogDescription>
              Create a new club. It will be created with pending status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAddClub)}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Upload */}
                <div className="grid gap-2 col-span-full">
                  <Label htmlFor="logo">
                    Logo <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                  />
                  {logoPreview && (
                    <div className="mt-2 flex flex-col items-center justify-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Preview:
                      </p>
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={logoPreview} alt="Logo preview" />
                        <AvatarFallback>LO</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                {/* Club Name */}
                <div className="grid gap-2 col-span-full">
                  <Label htmlFor="clubName">
                    Club Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="clubName"
                    placeholder="Computer Science Society"
                    {...register("clubName", {
                      required: "Club name is required",
                    })}
                  />
                  {errors.clubName && (
                    <p className="text-xs text-red-600">
                      {errors.clubName.message}
                    </p>
                  )}
                </div>

                {/* Club Acronym */}
                <div className="grid gap-2">
                  <Label htmlFor="clubAcr">
                    Club Acronym <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="clubAcr"
                    placeholder="CSS"
                    {...register("clubAcr", {
                      required: "Club acronym is required",
                    })}
                  />
                  {errors.clubAcr && (
                    <p className="text-xs text-red-600">
                      {errors.clubAcr.message}
                    </p>
                  )}
                </div>

                {/* Institution */}
                <div className="grid gap-2">
                  <Label htmlFor="institutionId">
                    Institution <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="institutionId"
                    control={control}
                    rules={{ required: "Institution is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger id="institutionId" className="w-full">
                          <SelectValue placeholder="Select an institution" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutions.map((inst) => (
                            <SelectItem key={inst.id} value={inst.id}>
                              {inst.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.institutionId && (
                    <p className="text-xs text-red-600">
                      {errors.institutionId.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="club@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09xx-xxx-xxxx"
                    {...register("phone", {
                      required: "Phone is required",
                    })}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* About */}
                <div className="grid gap-2 col-span-full">
                  <Label htmlFor="about">About (Optional)</Label>
                  <Textarea
                    id="about"
                    placeholder="A brief description of the club..."
                    rows={4}
                    {...register("about")}
                  />
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
                  setLogoFile(null);
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
                  "Add Club"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Club Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Club Details</DialogTitle>
            <DialogDescription>
              View club information and status
            </DialogDescription>
          </DialogHeader>
          {viewClub && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewClub.logo} alt={viewClub.clubName} />
                  <AvatarFallback>
                    {viewClub.clubAcr
                      ? viewClub.clubAcr.toUpperCase().slice(0, 2)
                      : getInitials(viewClub.clubName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewClub.clubName}
                  </h3>
                  {viewClub.clubAcr && (
                    <p className="text-sm text-muted-foreground">
                      {viewClub.clubAcr}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Institution</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewClub.institutionName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant={getStatusBadgeVariant(viewClub.status)}>
                      {viewClub.status}
                    </Badge>
                  </p>
                </div>
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
                {viewClub.about && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">About</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewClub.about}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewClub.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated At</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewClub.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
