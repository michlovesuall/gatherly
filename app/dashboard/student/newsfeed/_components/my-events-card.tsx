"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventItem } from "@/lib/repos/student";
import { EmptyState } from "../../_components/empty-state";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface MyEventsCardProps {
  going: EventItem[];
  interested: EventItem[];
  isLoading?: boolean;
  onRsvpChange?: (eventId?: string, previousState?: "going" | "interested") => void;
}

// Date formatting function - called only on client side to avoid hydration mismatch
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventListItem({ 
  event, 
  onCancel,
  currentState
}: { 
  event: EventItem;
  onCancel?: (eventId: string, state: "going" | "interested") => void;
  currentState: "going" | "interested";
}) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Format date on client side to avoid hydration mismatch
    const startDate = new Date(event.startAt);
    setFormattedDate(formatDate(startDate));
  }, [event.startAt]);

  const handleCancel = async () => {
    if (!onCancel) return;
    
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: null }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to remove RSVP");
      }

      // Show specific toast message based on state
      if (currentState === "going") {
        toast.success("You're no longer going to this event");
      } else {
        toast.success("You're no longer interested in this event");
      }

      // Pass eventId and state to onCancel
      onCancel(event.id, currentState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove RSVP";
      toast.error(errorMessage);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="group border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <h4 className="font-semibold text-sm">{event.title}</h4>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate || "Loading..."}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleCancel}
            disabled={isRemoving}
            title="Remove RSVP"
          >
            {isRemoving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EventListItemSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function MyEventsCard({
  going,
  interested,
  isLoading = false,
  onRsvpChange,
}: MyEventsCardProps) {
  // Only use actual events, no static examples to avoid hydration issues
  const displayGoing = going;
  const displayInterested = interested;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, idx) => (
            <EventListItemSkeleton key={idx} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="going">
          <TabsList className="w-full">
            <TabsTrigger value="going" className="flex-1">
              Going
            </TabsTrigger>
            <TabsTrigger value="interested" className="flex-1">
              Interested
            </TabsTrigger>
          </TabsList>

          <TabsContent value="going" className="space-y-3 mt-4">
            {displayGoing.length === 0 ? (
              <EmptyState
                title="No upcoming events"
                description="You haven't RSVPed to anything yet."
                action={<Button size="sm">Browse Events</Button>}
              />
            ) : (
              displayGoing.map((event) => (
                <EventListItem 
                  key={event.id} 
                  event={event} 
                  onCancel={onRsvpChange}
                  currentState="going"
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="interested" className="space-y-3 mt-4">
            {displayInterested.length === 0 ? (
              <EmptyState
                title="No interested events"
                description="You haven't marked any events as interested."
                action={<Button size="sm">Browse Events</Button>}
              />
            ) : (
              displayInterested.map((event) => (
                <EventListItem 
                  key={event.id} 
                  event={event} 
                  onCancel={onRsvpChange}
                  currentState="interested"
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

