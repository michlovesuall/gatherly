"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Heart, MessageCircle, Bell, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsfeedItem } from "@/lib/repos/student";
import { EmptyState } from "../../_components/empty-state";

export interface NewsfeedFeedProps {
  items: NewsfeedItem[];
  filter: "for-you" | "global";
  onFilterChange: (filter: "for-you" | "global") => void;
  loading?: boolean;
}

function EventCard({ item }: { item: NewsfeedItem }) {
  if (item.type !== "event") return null;

  const startDate = item.startAt ? new Date(item.startAt) : null;
  const endDate = item.endAt ? new Date(item.endAt) : null;

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
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{item.title}</h3>
          </div>
          {item.rsvpState && (
            <Badge
              variant={
                item.rsvpState === "going"
                  ? "default"
                  : item.rsvpState === "interested"
                  ? "secondary"
                  : "outline"
              }
            >
              {item.rsvpState === "going" ? "Going" : "Interested"}
            </Badge>
          )}
        </div>

        {startDate && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(startDate)}
                {endDate && ` - ${formatDate(endDate)}`}
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

        {item.counts && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {item.counts.going} going
                {item.maxSlots && ` / ${item.maxSlots} max`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {item.counts.interested} interested
              </span>
            </div>
            {item.counts.likes !== undefined && (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{item.counts.likes}</span>
              </div>
            )}
            {item.counts.comments !== undefined && (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{item.counts.comments}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant={item.rsvpState === "going" ? "default" : "outline"}>
            Going
          </Button>
          <Button size="sm" variant={item.rsvpState === "interested" ? "secondary" : "outline"}>
            Interested
          </Button>
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{item.title}</h3>
          </div>
          {item.clubName && (
            <Badge variant="outline">
              <Building2 className="h-3 w-3 mr-1" />
              {item.clubName}
            </Badge>
          )}
        </div>

        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {item.authorType === "club" ? "Club" : "Institution"}: {item.author || "Unknown"}
          </span>
          <span>{formattedDate}</span>
        </div>
      </CardHeader>
    </Card>
  );
}

function FeedItemSkeleton() {
  return (
    <Card>
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

// Static example feed items for demonstration
const staticFeedItems: NewsfeedItem[] = [
  {
    type: "event",
    id: "static-event-1",
    title: "Annual Science Fair 2024",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    visibility: "public",
    startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    venue: "Main Auditorium",
    maxSlots: 200,
    counts: {
      going: 45,
      interested: 23,
      checkedIn: 0,
      likes: 12,
      comments: 8,
    },
    rsvpState: null,
  },
  {
    type: "announcement",
    id: "static-announcement-1",
    title: "Important: Registration Deadline Extended",
    content: "Due to popular demand, we are extending the registration deadline for the upcoming semester. All students must complete their registration by the new deadline of March 15, 2024. Please ensure all required documents are submitted on time.",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    author: "Administration Office",
    authorType: "institution",
    visibility: "institution",
  },
  {
    type: "event",
    id: "static-event-2",
    title: "Tech Innovation Workshop",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    visibility: "institution",
    startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    venue: "Computer Science Building, Room 301",
    maxSlots: 50,
    counts: {
      going: 32,
      interested: 15,
      checkedIn: 0,
      likes: 28,
      comments: 14,
    },
    rsvpState: "going",
  },
  {
    type: "announcement",
    id: "static-announcement-2",
    title: "New Library Resources Available",
    content: "We're excited to announce that new digital resources have been added to the library database. Access thousands of e-books, research papers, and academic journals. Visit the library website to explore the new collection.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    author: "Library Services",
    authorType: "institution",
    visibility: "institution",
  },
  {
    type: "event",
    id: "static-event-3",
    title: "Career Development Seminar",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    visibility: "public",
    startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    venue: "Conference Hall",
    maxSlots: 150,
    counts: {
      going: 78,
      interested: 42,
      checkedIn: 0,
      likes: 56,
      comments: 22,
    },
    rsvpState: "interested",
  },
];

export function NewsfeedFeed({
  items,
  filter,
  onFilterChange,
  loading = false,
}: NewsfeedFeedProps) {
  // Combine static examples with actual items, or use static if no items
  const displayItems = items.length > 0 ? items : staticFeedItems;

  return (
    <div className="space-y-4 pb-6">
      {/* Feed Items */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <FeedItemSkeleton key={idx} />
          ))
        ) : displayItems.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="No items in feed"
                description={
                  filter === "for-you"
                    ? "No events or announcements available for your institution."
                    : "No public events or announcements available."
                }
              />
            </CardContent>
          </Card>
        ) : (
          displayItems.map((item) => (
            <div key={`${item.type}-${item.id}`}>
              {item.type === "event" ? (
                <EventCard item={item} />
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

