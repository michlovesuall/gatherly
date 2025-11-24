"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Heart, MessageCircle, Bell, Building2, Globe, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import type { NewsfeedItem } from "@/lib/repos/student";
import { EmptyState } from "../../_components/empty-state";

export interface NewsfeedFeedProps {
  items: NewsfeedItem[];
  loading?: boolean;
  role?: "student" | "employee" | "institution" | "super_admin";
}

function EventCard({ item, role }: { item: NewsfeedItem; role?: "student" | "employee" | "institution" | "super_admin" }) {
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
          {item.rsvpState && role !== "institution" && role !== "super_admin" && (
            <div className="absolute top-3 right-3">
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
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Event
                </Badge>
              </>
            )}
            <h3 className="text-lg font-semibold">{item.title}</h3>
          </div>
          {!item.imageUrl && item.rsvpState && role !== "institution" && role !== "super_admin" && (
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

        {/* Description */}
        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
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
          <Badge
            variant="outline"
            className="text-xs"
          >
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
          </div>

          {/* Action Buttons - Vertically Arranged - Only show for Student and Employee */}
          {role !== "institution" && role !== "super_admin" && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button 
                size="sm" 
                variant={item.rsvpState === "going" ? "default" : "outline"}
                className={item.rsvpState === "going" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                Going
              </Button>
              <Button 
                size="sm" 
                variant={item.rsvpState === "interested" ? "secondary" : "outline"}
                className={item.rsvpState === "interested" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                Interested
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300"
              >
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
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
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
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
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
          <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
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
          <Badge
            variant="outline"
            className="text-xs"
          >
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
}: NewsfeedFeedProps) {
  return (
    <div className="space-y-4 pb-6">
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
                <EventCard item={item} role={role} />
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

