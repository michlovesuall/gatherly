import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Tag, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventItem } from "@/lib/repos/student";
import { EmptyState } from "./empty-state";
import { Sparkles } from "lucide-react";

export interface RecommendedEventsProps {
  recommendations: EventItem[];
  isLoading?: boolean;
}

function RecommendedEventCard({ event }: { event: EventItem }) {
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
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{event.title}</CardTitle>
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
            {event.tags.slice(0, 2).map((tag, idx) => (
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
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

function RecommendedEventCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function RecommendedEvents({
  recommendations,
  isLoading = false,
}: RecommendedEventsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>Recommended for You</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <RecommendedEventCardSkeleton key={idx} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>Recommended for You</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No picks yet"
            description="Attend events to improve recommendations."
            icon={<Sparkles className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <CardTitle>Recommended for You</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recommendations.map((event) => (
            <RecommendedEventCard key={event.id} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
