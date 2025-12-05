"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Calendar,
  CalendarCheck2,
  Clock,
  MapPin,
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import type {
  InstitutionEventStats,
  InstitutionEventListItem,
} from "@/lib/repos/institution";

export interface InstitutionEventsPageProps {
  stats: InstitutionEventStats;
  events: InstitutionEventListItem[];
  total: number;
  initialStatus: string;
  initialSearch: string;
  initialSortBy: string;
  initialSortOrder: string;
  clubs: Array<{ clubId: string; name: string; acronym?: string }>;
}

interface EventFormData {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  venue: string;
  link: string;
  maxSlots: string;
  visibility: "public" | "institution" | "restricted";
  status: "draft" | "pending" | "published";
  tags: string;
  clubId: string;
}

export function InstitutionEventsPage({
  stats,
  events: initialEvents,
  total: initialTotal,
  initialStatus,
  initialSearch,
  initialSortBy,
  initialSortOrder,
  clubs,
}: InstitutionEventsPageProps) {
  const router = useRouter();

  // Filters state
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<InstitutionEventListItem | null>(
    null
  );
  const [editEvent, setEditEvent] = useState<InstitutionEventListItem | null>(
    null
  );
  const [deleteEvent, setDeleteEvent] =
    useState<InstitutionEventListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EventFormData>({
    defaultValues: {
      visibility: "institution",
      status: "published",
      clubId: "",
    },
  });

  // Preview image from file
  const preview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (imagePreview) return imagePreview;
    return "";
  }, [imageFile, imagePreview]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Handle image file change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setFormError("Invalid image type. Only JPEG, PNG, and WebP are allowed.");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setFormError("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      setFormError(null);
    }
  };

  // Update URL when filters change
  const updateFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      if (sortBy && sortBy !== "createdAt") params.set("sortBy", sortBy);
      if (sortOrder && sortOrder !== "desc") params.set("sortOrder", sortOrder);

      const url = params.toString()
        ? `/dashboard/institution/events?${params.toString()}`
        : "/dashboard/institution/events";
      router.push(url);
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => updateFilters(), 300);
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateFilters();
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    updateFilters();
  };

  // Handle view event
  const handleViewEvent = (event: InstitutionEventListItem) => {
    setViewEvent(event);
    setIsViewModalOpen(true);
  };

  // Handle edit event
  const handleEditEvent = (event: InstitutionEventListItem) => {
    setEditEvent(event);
    setImagePreview(event.imageUrl || null);
    setImageFile(null);
    setValue("title", event.title);
    setValue("description", event.description);
    setValue("startAt", event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : "");
    setValue("endAt", event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : "");
    setValue("venue", event.venue || "");
    setValue("link", event.link || "");
    setValue("maxSlots", event.maxSlots?.toString() || "");
    setValue("visibility", event.visibility);
    setValue("status", event.status === "published" || event.status === "approved" ? "published" : event.status as "draft" | "pending" | "published");
    setValue("tags", event.tags?.join(", ") || "");
    setValue("clubId", event.clubId || "");
    setIsEditModalOpen(true);
  };

  // Handle delete event
  const handleDeleteEvent = (event: InstitutionEventListItem) => {
    setDeleteEvent(event);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteEvent) return;

    setActionLoading(deleteEvent.eventId);
    try {
      const res = await fetch(`/api/institution/events/${deleteEvent.eventId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to delete event");
        return;
      }

      setIsDeleteModalOpen(false);
      setDeleteEvent(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete event");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle approve/reject
  const handleApproveReject = async (
    eventId: string,
    action: "approve" | "reject"
  ) => {
    setActionLoading(eventId);
    try {
      const res = await fetch(`/api/institution/events/${eventId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || `Failed to ${action} event`);
        return;
      }

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : `Failed to ${action} event`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle form submission (create)
  const onSubmitCreate = async (data: EventFormData) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("startAt", new Date(data.startAt).toISOString());
      if (data.endAt) {
        formData.append("endAt", new Date(data.endAt).toISOString());
      }
      formData.append("venue", data.venue);
      if (data.link) formData.append("link", data.link);
      if (data.maxSlots) formData.append("maxSlots", data.maxSlots);
      formData.append("visibility", data.visibility);
      formData.append("status", data.status);
      if (data.tags) formData.append("tags", data.tags);
      if (data.clubId) formData.append("clubId", data.clubId);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/institution/events", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to create event");
      }

      setIsAddModalOpen(false);
      reset();
      setImageFile(null);
      setImagePreview(null);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission (edit)
  const onSubmitEdit = async (data: EventFormData) => {
    if (!editEvent) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("startAt", new Date(data.startAt).toISOString());
      if (data.endAt) {
        formData.append("endAt", new Date(data.endAt).toISOString());
      }
      formData.append("venue", data.venue);
      if (data.link) formData.append("link", data.link);
      if (data.maxSlots) formData.append("maxSlots", data.maxSlots);
      formData.append("visibility", data.visibility);
      formData.append("status", data.status);
      if (data.tags) formData.append("tags", data.tags);
      if (imageFile) formData.append("image", imageFile);
      if (!imageFile && !imagePreview) {
        formData.append("removeImage", "true");
      }

      const res = await fetch(`/api/institution/events/${editEvent.eventId}`, {
        method: "PATCH",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update event");
      }

      setIsEditModalOpen(false);
      setEditEvent(null);
      setImageFile(null);
      setImagePreview(null);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to update event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published":
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
        <p className="text-muted-foreground">
          Manage all events within your institution
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Published events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected events</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Events</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by event title..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                  updateFilters();
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="startAt-asc">Start Date (Asc)</SelectItem>
                  <SelectItem value="startAt-desc">Start Date (Desc)</SelectItem>
                  <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                  <SelectItem value="status-desc">Status (Z-A)</SelectItem>
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
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No events found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  initialEvents.map((event) => (
                    <TableRow key={event.eventId}>
                      <TableCell>
                        {event.imageUrl ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={event.imageUrl} alt={event.title} />
                            <AvatarFallback>
                              <ImageIcon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px] truncate" title={event.title}>
                          {event.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(event.startAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={event.venue}>
                          {event.venue || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{event.posterName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {event.clubName || "Institution"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEvent(event)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {event.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleApproveReject(event.eventId, "approve")
                                }
                                disabled={actionLoading === event.eventId}
                              >
                                {actionLoading === event.eventId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleApproveReject(event.eventId, "reject")
                                }
                                disabled={actionLoading === event.eventId}
                              >
                                {actionLoading === event.eventId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEvent(event)}
                            disabled={actionLoading === event.eventId}
                          >
                            {actionLoading === event.eventId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
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

      {/* View Event Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>View complete event information</DialogDescription>
          </DialogHeader>
          {viewEvent && (
            <div className="space-y-4">
              {viewEvent.imageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={viewEvent.imageUrl}
                    alt={viewEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm font-semibold">{viewEvent.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {viewEvent.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(viewEvent.startAt)}
                  </p>
                </div>
                {viewEvent.endAt && (
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(viewEvent.endAt)}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Venue</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.venue || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadgeVariant(viewEvent.status)}>
                    {viewEvent.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.visibility}
                  </p>
                </div>
                {viewEvent.maxSlots && (
                  <div>
                    <Label className="text-sm font-medium">Max Slots</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewEvent.maxSlots}
                    </p>
                  </div>
                )}
                {viewEvent.link && (
                  <div>
                    <Label className="text-sm font-medium">Link</Label>
                    <a
                      href={viewEvent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {viewEvent.link}
                    </a>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Creator</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.posterName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Club</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.clubName || "Institution"}
                  </p>
                </div>
              </div>
              {viewEvent.tags && viewEvent.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewEvent.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Create a new event for your institution
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)}>
            <div className="space-y-4">
              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Title <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && (
                  <p className="text-xs text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">
                  Description <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter event description"
                  rows={4}
                  {...register("description", {
                    required: "Description is required",
                  })}
                />
                {errors.description && (
                  <p className="text-xs text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startAt">
                    Start Date & Time <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    {...register("startAt", { required: "Start date is required" })}
                  />
                  {errors.startAt && (
                    <p className="text-xs text-red-600">
                      {errors.startAt.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endAt">End Date & Time</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    min={watch("startAt") || new Date().toISOString().slice(0, 16)}
                    {...register("endAt")}
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="grid gap-2">
                <Label htmlFor="venue">
                  Venue <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="venue"
                  placeholder="Enter venue"
                  {...register("venue", { required: "Venue is required" })}
                />
                {errors.venue && (
                  <p className="text-xs text-red-600">{errors.venue.message}</p>
                )}
              </div>

              {/* Link & Max Slots */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="link">Link (URL)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://..."
                    {...register("link")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxSlots">Max Slots</Label>
                  <Input
                    id="maxSlots"
                    type="number"
                    min="1"
                    placeholder="Optional"
                    {...register("maxSlots")}
                  />
                </div>
              </div>

              {/* Visibility & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={watch("visibility")}
                    onValueChange={(value) =>
                      setValue("visibility", value as "public" | "institution" | "restricted")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="institution">Institution</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) =>
                      setValue("status", value as "draft" | "pending" | "published")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Club Assignment */}
              <div className="grid gap-2">
                <Label htmlFor="clubId">Assign to Club (Optional)</Label>
                <Select
                  value={watch("clubId")}
                  onValueChange={(value) => setValue("clubId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club (or leave for institution)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Institution (No Club)</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club.clubId} value={club.clubId}>
                        {club.name} {club.acronym && `(${club.acronym})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="tag1, tag2, tag3"
                  {...register("tags")}
                />
              </div>

              {/* Image Upload */}
              <div className="grid gap-2">
                <Label htmlFor="image">Event Image (Optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {preview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
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
                  setImageFile(null);
                  setImagePreview(null);
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
                    Create Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal - Similar structure to Create, but with pre-filled values */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event information</DialogDescription>
          </DialogHeader>
          {editEvent && (
            <form onSubmit={handleSubmit(onSubmitEdit)}>
              <div className="space-y-4">
                {/* Same form fields as create, but with editEvent values */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">
                    Title <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    {...register("title", { required: "Title is required" })}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">
                    Description <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    {...register("description", {
                      required: "Description is required",
                    })}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-startAt">
                      Start Date & Time <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="edit-startAt"
                      type="datetime-local"
                      {...register("startAt", { required: "Start date is required" })}
                    />
                    {errors.startAt && (
                      <p className="text-xs text-red-600">
                        {errors.startAt.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-endAt">End Date & Time</Label>
                    <Input
                      id="edit-endAt"
                      type="datetime-local"
                      min={watch("startAt") || new Date().toISOString().slice(0, 16)}
                      {...register("endAt")}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-venue">
                    Venue <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="edit-venue"
                    {...register("venue", { required: "Venue is required" })}
                  />
                  {errors.venue && (
                    <p className="text-xs text-red-600">{errors.venue.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-link">Link (URL)</Label>
                    <Input id="edit-link" type="url" {...register("link")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-maxSlots">Max Slots</Label>
                    <Input
                      id="edit-maxSlots"
                      type="number"
                      min="1"
                      {...register("maxSlots")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-visibility">Visibility</Label>
                    <Select
                      value={watch("visibility")}
                      onValueChange={(value) =>
                        setValue("visibility", value as "public" | "institution" | "restricted")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="institution">Institution</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={watch("status")}
                      onValueChange={(value) =>
                        setValue("status", value as "draft" | "pending" | "published")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input id="edit-tags" {...register("tags")} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-image">Event Image</Label>
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {preview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!preview && !imageFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      Remove Image
                    </Button>
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
                    setIsEditModalOpen(false);
                    setEditEvent(null);
                    setImageFile(null);
                    setImagePreview(null);
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Event
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteEvent?.title}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deleteEvent && (
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Event Title</Label>
                  <p className="text-sm text-muted-foreground">
                    {deleteEvent.title}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(deleteEvent.startAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteEvent(null);
              }}
              disabled={actionLoading === deleteEvent?.eventId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={actionLoading === deleteEvent?.eventId}
            >
              {actionLoading === deleteEvent?.eventId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

