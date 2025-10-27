import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClubAnnouncement } from "@/lib/repos/student";
import { EmptyState } from "./empty-state";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface ClubAnnouncementsProps {
  items: ClubAnnouncement[];
  isLoading?: boolean;
}

function AnnouncementItem({
  announcement,
}: {
  announcement: ClubAnnouncement;
}) {
  const createdAt = new Date(announcement.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {announcement.clubName}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <h4 className="font-semibold text-sm mb-1">{announcement.title}</h4>
      {announcement.body && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {announcement.body}
        </p>
      )}
    </div>
  );
}

function AnnouncementItemSkeleton() {
  return (
    <div className="p-4 rounded-lg border space-y-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function ClubAnnouncements({
  items,
  isLoading = false,
}: ClubAnnouncementsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-xl">Club Announcements</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <AnnouncementItemSkeleton key={idx} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-xl">Club Announcements</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No announcements"
            description="You don't have any club announcements yet."
            icon={<Bell className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle className="text-xl">Club Announcements</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {items.map((announcement) => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
          <ScrollBar />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
