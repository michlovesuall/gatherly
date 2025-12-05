"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  Image as ImageIcon,
  User,
  Building2,
} from "lucide-react";
import type { InstitutionEventListItem } from "@/lib/repos/institution";

export interface InstitutionEventsApprovalsPageProps {
  events: InstitutionEventListItem[];
  initialSearch: string;
  institutionId: string;
}

export function InstitutionEventsApprovalsPage({
  events: initialEvents,
  initialSearch,
  institutionId,
}: InstitutionEventsApprovalsPageProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialSearch);

  const [viewEvent, setViewEvent] = useState<InstitutionEventListItem | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [eventToReject, setEventToReject] =
    useState<InstitutionEventListItem | null>(null);

  const updateFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const url = params.toString()
        ? `/dashboard/institution/events/approvals?${params.toString()}`
        : "/dashboard/institution/events/approvals";
      router.push(url);
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => updateFilters(), 300);
  };

  const handleViewEvent = (event: InstitutionEventListItem) => {
    setViewEvent(event);
    setIsViewModalOpen(true);
  };

  const handleApprove = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to approve this event? It will be published immediately."
      )
    ) {
      return;
    }

    setActionLoading(eventId);
    try {
      const res = await fetch(`/api/institution/events/${eventId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to approve event");
        return;
      }

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to approve event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (event: InstitutionEventListItem) => {
    setEventToReject(event);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!eventToReject) return;

    setActionLoading(eventToReject.eventId);
    try {
      const res = await fetch(
        `/api/institution/events/${eventToReject.eventId}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reject",
            reason: rejectionReason || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to reject event");
        return;
      }

      setIsRejectModalOpen(false);
      setEventToReject(null);
      setRejectionReason("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reject event");
    } finally {
      setActionLoading(null);
    }
  };

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

  const formatDateRange = (startAt: string, endAt?: string) => {
    const start = new Date(startAt);
    const startStr = start.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    if (!endAt) {
      return startStr;
    }

    const end = new Date(endAt);
    const endStr = end.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Event Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve pending events within your institution
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Pending Events</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by event title..."
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
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No pending events found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  initialEvents.map((event) => (
                    <TableRow key={event.eventId}>
                      <TableCell>
                        {event.imageUrl ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={event.imageUrl}
                              alt={event.title}
                            />
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
                        <div
                          className="max-w-[200px] truncate"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(event.startAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[150px] truncate"
                          title={event.venue}
                        >
                          {event.venue || "-"}
                        </div>
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
                            variant="default"
                            onClick={() => handleApprove(event.eventId)}
                            disabled={actionLoading === event.eventId}
                          >
                            {actionLoading === event.eventId ? (
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
                            onClick={() => handleRejectClick(event)}
                            disabled={actionLoading === event.eventId}
                          >
                            {actionLoading === event.eventId ? (
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Review event information before making a decision
            </DialogDescription>
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
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(viewEvent.startAt, viewEvent.endAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Venue
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.venue || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Creator
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.posterName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Club
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {viewEvent.clubName || "Institution"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Visibility</Label>
                  <Badge variant="outline">{viewEvent.visibility}</Badge>
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
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Link</Label>
                    <a
                      href={viewEvent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block truncate"
                    >
                      {viewEvent.link}
                    </a>
                  </div>
                )}
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
            {viewEvent && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleRejectClick(viewEvent);
                  }}
                  disabled={actionLoading === viewEvent.eventId}
                >
                  {actionLoading === viewEvent.eventId ? (
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
                    handleApprove(viewEvent.eventId);
                  }}
                  disabled={actionLoading === viewEvent.eventId}
                >
                  {actionLoading === viewEvent.eventId ? (
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

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject{" "}
              <strong>{eventToReject?.title}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {eventToReject && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Rejection Reason (Optional)
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a reason for rejection..."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be visible to the event creator.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectModalOpen(false);
                setEventToReject(null);
                setRejectionReason("");
              }}
              disabled={
                actionLoading === eventToReject?.eventId
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={actionLoading === eventToReject?.eventId}
            >
              {actionLoading === eventToReject?.eventId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

