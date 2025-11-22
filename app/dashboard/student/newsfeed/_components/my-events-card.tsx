"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventItem } from "@/lib/repos/student";
import { EmptyState } from "../../_components/empty-state";

export interface MyEventsCardProps {
  going: EventItem[];
  interested: EventItem[];
  isLoading?: boolean;
}

function EventListItem({ event }: { event: EventItem }) {
  const startDate = new Date(event.startAt);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="group border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <h4 className="font-semibold text-sm">{event.title}</h4>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(startDate)}</span>
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

// Static example events for demonstration
const staticGoingEvents: EventItem[] = [
  {
    id: "static-going-1",
    title: "Tech Innovation Workshop",
    startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    venue: "Computer Science Building, Room 301",
    visibility: "institution",
    counts: {
      going: 32,
      interested: 15,
      checkedIn: 0,
    },
    rsvpState: "going",
  },
  {
    id: "static-going-2",
    title: "Annual Science Fair 2024",
    startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    venue: "Main Auditorium",
    visibility: "public",
    counts: {
      going: 45,
      interested: 23,
      checkedIn: 0,
    },
    rsvpState: "going",
  },
  {
    id: "static-going-3",
    title: "Student Leadership Conference",
    startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    venue: "Student Center, Hall A",
    visibility: "institution",
    counts: {
      going: 67,
      interested: 34,
      checkedIn: 0,
    },
    rsvpState: "going",
  },
];

const staticInterestedEvents: EventItem[] = [
  {
    id: "static-interested-1",
    title: "Career Development Seminar",
    startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    venue: "Conference Hall",
    visibility: "public",
    counts: {
      going: 78,
      interested: 42,
      checkedIn: 0,
    },
    rsvpState: "interested",
  },
  {
    id: "static-interested-2",
    title: "Art Exhibition Opening",
    startAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
    endAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    venue: "Art Gallery",
    visibility: "institution",
    counts: {
      going: 28,
      interested: 19,
      checkedIn: 0,
    },
    rsvpState: "interested",
  },
  {
    id: "static-interested-3",
    title: "Sports Day 2024",
    startAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    endAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    venue: "Sports Complex",
    visibility: "public",
    counts: {
      going: 156,
      interested: 89,
      checkedIn: 0,
    },
    rsvpState: "interested",
  },
];

export function MyEventsCard({
  going,
  interested,
  isLoading = false,
}: MyEventsCardProps) {
  // Use static examples if no actual events
  const displayGoing = going.length > 0 ? going : staticGoingEvents;
  const displayInterested = interested.length > 0 ? interested : staticInterestedEvents;

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
                <EventListItem key={event.id} event={event} />
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
                <EventListItem key={event.id} event={event} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

