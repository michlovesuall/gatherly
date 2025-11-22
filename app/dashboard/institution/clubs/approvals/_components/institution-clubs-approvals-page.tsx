"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Search,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import type { InstitutionClubListItem } from "@/lib/repos/institution";

interface ClubFormData {
  clubName: string;
  clubAcr: string;
  email: string;
  phone: string;
  about: string;
}

export interface InstitutionClubsApprovalsPageProps {
  clubs: InstitutionClubListItem[];
  initialSearch: string;
  institutionId: string;
  institutionName: string;
}

export function InstitutionClubsApprovalsPage({
  clubs: initialClubs,
  initialSearch,
  institutionId,
  institutionName,
}: InstitutionClubsApprovalsPageProps) {
  const router = useRouter();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClubFormData>();

  // Filters state
  const [search, setSearch] = useState(initialSearch);

  // Modal state
  const [viewClub, setViewClub] = useState<InstitutionClubListItem | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update URL when filters change
  const updateFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const url = params.toString()
        ? `/dashboard/institution/clubs/approvals?${params.toString()}`
        : "/dashboard/institution/clubs/approvals";
      router.push(url);
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => updateFilters(), 300);
  };

  // Handle view club
  const handleViewClub = (club: InstitutionClubListItem) => {
    setViewClub(club);
    setIsViewModalOpen(true);
  };

  // Handle approve club
  const handleApprove = async (clubId: string) => {
    setActionLoading(clubId);
    try {
      const res = await fetch(`/api/institution/clubs/${clubId}/approve`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to approve club");
        return;
      }

      // Refresh the page
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to approve club");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject club
  const handleReject = async (clubId: string) => {
    if (!confirm("Are you sure you want to reject this club?")) {
      return;
    }

    setActionLoading(clubId);
    try {
      const res = await fetch(`/api/institution/clubs/${clubId}/reject`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to reject club");
        return;
      }

      // Refresh the page
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reject club");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add club form submission
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
      formData.append("about", data.about);
      formData.append("institutionId", institutionId);

      const res = await fetch("/api/institution/clubs", {
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
          Club Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve pending club applications within your organization
        </p>
      </div>

      {/* Pending Clubs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>Pending Clubs</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Club
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by acronym, club name, email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialClubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No pending clubs found</p>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                            onClick={() => handleApprove(club.clubId)}
                            disabled={actionLoading === club.clubId}
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
                            onClick={() => handleReject(club.clubId)}
                            disabled={actionLoading === club.clubId}
                          >
                            {actionLoading === club.clubId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
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

      {/* View Club Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Club Details</DialogTitle>
            <DialogDescription>
              Review club information before making a decision
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
                  <h3 className="text-lg font-semibold">
                    {viewClub.clubName}
                  </h3>
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
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            {viewClub && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleReject(viewClub.clubId);
                  }}
                  disabled={actionLoading === viewClub.clubId}
                >
                  {actionLoading === viewClub.clubId ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleApprove(viewClub.clubId);
                  }}
                  disabled={actionLoading === viewClub.clubId}
                >
                  {actionLoading === viewClub.clubId ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Club Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Club</DialogTitle>
            <DialogDescription>
              Create a new club for your institution
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAddClub)}>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="grid gap-2">
                <Label htmlFor="logo">
                  Logo <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setFormError(null);
                    }
                  }}
                  required
                />
                {errors.logo && (
                  <p className="text-xs text-red-600">{errors.logo.message}</p>
                )}
              </div>

              {/* Club Name */}
              <div className="grid gap-2">
                <Label htmlFor="clubName">
                  Club Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="clubName"
                  placeholder="Enter club name"
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

              {/* Acronym and Institution Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="clubAcr">
                    Acronym <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="clubAcr"
                    placeholder="Enter acronym"
                    {...register("clubAcr", {
                      required: "Acronym is required",
                    })}
                  />
                  {errors.clubAcr && (
                    <p className="text-xs text-red-600">
                      {errors.clubAcr.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={institutionName}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Email and Phone Row */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* About */}
              <div className="grid gap-2">
                <Label htmlFor="about">
                  About <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="about"
                  placeholder="Enter club description"
                  rows={4}
                  {...register("about", {
                    required: "About is required",
                  })}
                />
                {errors.about && (
                  <p className="text-xs text-red-600">{errors.about.message}</p>
                )}
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {formError}
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
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
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Club
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

