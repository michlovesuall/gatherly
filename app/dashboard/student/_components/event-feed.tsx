"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, Tag, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventItem } from "@/lib/repos/student";
import { EmptyState } from "./empty-state";

export interface EventFeedProps {
  events: EventItem[];
  isLoading?: boolean;
}

function EventCard({ event }: { event: EventItem }) {
  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          {event.rsvpState && (
            <Badge
              variant={
                event.rsvpState === "going"
                  ? "default"
                  : event.rsvpState === "interested"
                  ? "secondary"
                  : "outline"
              }
            >
              {event.rsvpState === "going"
                ? "Going"
                : event.rsvpState === "interested"
                ? "Interested"
                : "Not Going"}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(startDate)}</span>
            {endDate && <span>- {formatDate(endDate)}</span>}
          </div>
          {event.venue && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.venue}</span>
            </div>
          )}
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {event.counts && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{event.counts.going} going</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{event.counts.interested} interested</span>
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function EventFeed({ events, isLoading = false }: EventFeedProps) {
  const [activeTab, setActiveTab] = useState<"all" | "institution">("all");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <EventCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  const publicEvents = events.filter((e) => e.visibility === "public");
  const institutionEvents = events.filter(
    (e) => e.visibility === "institution"
  );
  const displayEvents = activeTab === "all" ? publicEvents : institutionEvents;

  if (displayEvents.length === 0) {
    return (
      <EmptyState
        title="No events found"
        description={
          activeTab === "all"
            ? "No public events available at the moment."
            : "No institution events available at the moment."
        }
        action={<Button>Browse Events</Button>}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="institution">Institution</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
