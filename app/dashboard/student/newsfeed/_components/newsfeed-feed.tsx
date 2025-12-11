"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Bell,
  Building2,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import type { NewsfeedItem } from "@/lib/repos/student";
import { EmptyState } from "../../_components/empty-state";
import { toast } from "sonner";

export interface NewsfeedFeedProps {
  items: NewsfeedItem[];
  loading?: boolean;
  role?: "student" | "employee" | "institution" | "super_admin";
}

function EventCard({
  item,
  role,
  onRsvpChange,
}: {
  item: NewsfeedItem;
  role?: "student" | "employee" | "institution" | "super_admin";
  onRsvpChange?: () => void;
}) {
  // All hooks must be called before any early returns
  const [rsvpState, setRsvpState] = useState<"going" | "interested" | null>(
    item.type === "event" ? item.rsvpState || null : null
  );
  const [counts, setCounts] = useState(
    item.type === "event"
      ? item.counts || { going: 0, interested: 0, checkedIn: 0 }
      : { going: 0, interested: 0, checkedIn: 0 }
  );
  const [loading, setLoading] = useState(false);
  const [formattedStartDate, setFormattedStartDate] = useState<string>("");
  const [formattedEndDate, setFormattedEndDate] = useState<string>("");

  // Use useMemo to memoize dates to fix exhaustive-deps warning
  const startAt = item.type === "event" ? item.startAt : null;
  const endAt = item.type === "event" ? item.endAt : null;

  const startDate = useMemo(
    () => (startAt ? new Date(startAt) : null),
    [startAt]
  );
  const endDate = useMemo(() => (endAt ? new Date(endAt) : null), [endAt]);

  // Format dates on client side to avoid hydration mismatch
  useEffect(() => {
    if (startDate) {
      const formatted = startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setFormattedStartDate(formatted);
    }
    if (endDate) {
      const formatted = endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setFormattedEndDate(formatted);
    }
  }, [startDate, endDate]);

  // Early return after all hooks
  if (item.type !== "event") return null;

  const handleRsvp = async (newState: "going" | "interested" | null) => {
    // If clicking the same state, remove RSVP (toggle off)
    const finalState = rsvpState === newState ? null : newState;

    // Optimistic update
    const previousState = rsvpState;
    const previousCounts = { ...counts };

    setRsvpState(finalState);

    // Update counts optimistically
    if (previousState === "going" && finalState !== "going") {
      setCounts((prev) => ({ ...prev, going: Math.max(0, prev.going - 1) }));
    } else if (previousState !== "going" && finalState === "going") {
      setCounts((prev) => ({ ...prev, going: prev.going + 1 }));
      // If was interested, decrease interested count
      if (previousState === "interested") {
        setCounts((prev) => ({
          ...prev,
          interested: Math.max(0, prev.interested - 1),
        }));
      }
    }

    if (previousState === "interested" && finalState !== "interested") {
      setCounts((prev) => ({
        ...prev,
        interested: Math.max(0, prev.interested - 1),
      }));
    } else if (previousState !== "interested" && finalState === "interested") {
      setCounts((prev) => ({ ...prev, interested: prev.interested + 1 }));
      // If was going, decrease going count
      if (previousState === "going") {
        setCounts((prev) => ({ ...prev, going: Math.max(0, prev.going - 1) }));
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/events/${item.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: finalState }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update RSVP");
      }

      // Update with server response
      setRsvpState(data.state);
      setCounts(data.counts);

      // Show success message
      if (finalState === "going") {
        toast.success("You're going to this event!");
      } else if (finalState === "interested") {
        toast.success("Marked as interested");
      } else {
        // More specific messages based on previous state
        if (previousState === "going") {
          toast.success("You're no longer going to this event");
        } else if (previousState === "interested") {
          toast.success("You're no longer interested in this event");
        } else {
          toast.success("RSVP removed");
        }
      }

      // Refresh My Events
      if (onRsvpChange) {
        onRsvpChange();
      }
    } catch (error) {
      // Revert optimistic update
      setRsvpState(previousState);
      setCounts(previousCounts);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to update RSVP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {/* Post Image */}
      {item.imageUrl && (
        <div className="relative w-full h-64 bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Post Type Badge - Overlay on Image */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              Event
            </Badge>
          </div>
          {/* RSVP Badge - Overlay on Image - Only show for Student and Employee */}
          {rsvpState && role !== "institution" && role !== "super_admin" && (
            <div className="absolute top-3 right-3">
              <Badge
                variant={
                  rsvpState === "going"
                    ? "default"
                    : rsvpState === "interested"
                    ? "secondary"
                    : "outline"
                }
              >
                {rsvpState === "going" ? "Going" : "Interested"}
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {!item.imageUrl && (
              <>
                <Calendar className="h-5 w-5 text-primary" />
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Event
                </Badge>
              </>
            )}
            <h3 className="text-lg font-semibold">{item.title}</h3>
          </div>
          {!item.imageUrl &&
            rsvpState &&
            role !== "institution" &&
            role !== "super_admin" && (
              <Badge
                variant={
                  rsvpState === "going"
                    ? "default"
                    : rsvpState === "interested"
                    ? "secondary"
                    : "outline"
                }
              >
                {rsvpState === "going" ? "Going" : "Interested"}
              </Badge>
            )}
        </div>

        {/* Description */}
        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.content}
          </p>
        )}

        {/* Institution Name and Privacy */}
        <div className="flex items-center gap-3 flex-wrap">
          {item.institutionName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{item.institutionName}</span>
            </div>
          )}
          {/* Privacy Badge */}
          <Badge variant="outline" className="text-xs">
            {item.visibility === "public" ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Public
              </>
            ) : item.visibility === "institution" ? (
              <>
                <Building2 className="h-3 w-3 mr-1" />
                Institution Only
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Restricted
              </>
            )}
          </Badge>
        </div>

        {/* Event Details and Buttons in Same Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Event Details */}
          <div className="flex flex-col gap-2 flex-1">
            {startDate && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formattedStartDate || "Loading..."}
                    {endDate && formattedEndDate && ` - ${formattedEndDate}`}
                  </span>
                </div>
                {item.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{item.venue}</span>
                  </div>
                )}
              </div>
            )}

            {counts && (
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {counts.going} going
                    {item.maxSlots && ` / ${item.maxSlots} max`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {counts.interested} interested
                  </span>
                </div>
                {counts.likes !== undefined && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {counts.likes}
                    </span>
                  </div>
                )}
                {counts.comments !== undefined && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {counts.comments}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons - Vertically Arranged - Only show for Student and Employee */}
          {role !== "institution" && role !== "super_admin" && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant={rsvpState === "going" ? "default" : "outline"}
                className={
                  rsvpState === "going"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }
                onClick={() => handleRsvp("going")}
                disabled={loading}
              >
                {loading && rsvpState === "going" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Going
              </Button>
              <Button
                size="sm"
                variant={rsvpState === "interested" ? "secondary" : "outline"}
                className={
                  rsvpState === "interested"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : ""
                }
                onClick={() => handleRsvp("interested")}
                disabled={loading}
              >
                {loading && rsvpState === "interested" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300"
                onClick={() => handleRsvp(null)}
                disabled={loading}
              >
                {loading && rsvpState === null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Not Interested
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function AnnouncementCard({ item }: { item: NewsfeedItem }) {
  if (item.type !== "announcement") return null;

  const createdAt = new Date(item.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {/* Post Image */}
      {item.imageUrl && (
        <div className="relative w-full h-64 bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Post Type Badge - Overlay on Image */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground">
              <Bell className="h-3 w-3 mr-1" />
              Announcement
            </Badge>
          </div>
          {/* Club Name Badge - Overlay on Image */}
          {item.clubName && (
            <div className="absolute top-3 right-3">
              <Badge
                variant="outline"
                className="bg-background/80 backdrop-blur-sm"
              >
                <Building2 className="h-3 w-3 mr-1" />
                {item.clubName}
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {!item.imageUrl && (
              <>
                <Bell className="h-5 w-5 text-primary" />
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Announcement
                </Badge>
              </>
            )}
            <h3 className="text-lg font-semibold">{item.title}</h3>
          </div>
          {!item.imageUrl && item.clubName && (
            <Badge variant="outline">
              <Building2 className="h-3 w-3 mr-1" />
              {item.clubName}
            </Badge>
          )}
        </div>

        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.content}
          </p>
        )}

        {/* Institution Name and Privacy */}
        <div className="flex items-center gap-3 flex-wrap">
          {item.institutionName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{item.institutionName}</span>
            </div>
          )}
          {/* Privacy Badge */}
          <Badge variant="outline" className="text-xs">
            {item.visibility === "public" ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Public
              </>
            ) : item.visibility === "institution" ? (
              <>
                <Building2 className="h-3 w-3 mr-1" />
                Institution Only
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Restricted
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formattedDate}</span>
        </div>
      </CardHeader>
    </Card>
  );
}

function FeedItemSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="w-full h-64" />
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function NewsfeedFeed({
  items,
  loading = false,
  role,
  onRsvpChange,
}: NewsfeedFeedProps & {
  onRsvpChange?: (
    eventId?: string,
    previousState?: "going" | "interested"
  ) => void;
}) {
  return (
    <div className="w-full max-w-3xl space-y-4 py-4">
      {/* Feed Items */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <FeedItemSkeleton key={idx} />
          ))
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="No items in feed"
                description="No events or announcements available."
              />
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <div key={`${item.type}-${item.id}`}>
              {item.type === "event" ? (
                <EventCard
                  item={item}
                  role={role}
                  onRsvpChange={onRsvpChange}
                />
              ) : (
                <AnnouncementCard item={item} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
