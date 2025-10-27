"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventItem } from "@/lib/repos/student";
import { EmptyState } from "./empty-state";

export interface MyEventsProps {
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
          <h4 className="font-semibold">{event.title}</h4>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(startDate)}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.venue}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="sm">
            Open Event
          </Button>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EventListItemSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function MyEvents({
  going,
  interested,
  isLoading = false,
}: MyEventsProps) {
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
            {going.length === 0 ? (
              <EmptyState
                title="No upcoming events"
                description="You haven't RSVPed to anything yet."
                action={<Button>Browse Events</Button>}
              />
            ) : (
              going.map((event) => (
                <EventListItem key={event.id} event={event} />
              ))
            )}
          </TabsContent>

          <TabsContent value="interested" className="space-y-3 mt-4">
            {interested.length === 0 ? (
              <EmptyState
                title="No interested events"
                description="You haven't marked any events as interested."
                action={<Button>Browse Events</Button>}
              />
            ) : (
              interested.map((event) => (
                <EventListItem key={event.id} event={event} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
