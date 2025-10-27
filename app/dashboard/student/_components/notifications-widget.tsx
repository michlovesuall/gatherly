import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
interface Notification {
  id: string;
  title: string;
  time: string;
  unread?: boolean;
}
import { EmptyState } from "./empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollBar } from "@/components/ui/scroll-area";

export interface NotificationsWidgetProps {
  items: Notification[];
  isLoading?: boolean;
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        notification.unread ? "bg-accent" : ""
      } hover:bg-accent/50 transition-colors`}
    >
      {notification.unread && (
        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm ${notification.unread ? "font-semibold" : ""}`}>
          {notification.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {notification.time}
        </p>
      </div>
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function NotificationsWidget({
  items,
  isLoading = false,
}: NotificationsWidgetProps) {
  const displayNotifications = items.slice(0, 5);
  const unreadCount = items.filter((item) => item.unread).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Notifications</CardTitle>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {unreadCount} new
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <NotificationItemSkeleton key={idx} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No notifications"
            description="You're all caught up!"
            icon={<Bell className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Notifications</CardTitle>
        {unreadCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {unreadCount} new
          </span>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {displayNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
          <ScrollBar />
        </ScrollArea>
        <Button variant="ghost" className="w-full mt-2" size="sm">
          View all notifications
        </Button>
      </CardContent>
    </Card>
  );
}
