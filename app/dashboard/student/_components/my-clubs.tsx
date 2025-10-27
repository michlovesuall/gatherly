"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Club } from "@/lib/repos/student";
import { EmptyState } from "./empty-state";

export interface MyClubsProps {
  clubs: Club[];
  isLoading?: boolean;
}

function ClubCard({ club }: { club: Club }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
        <div>
          <CardTitle className="text-lg">{club.name}</CardTitle>
          {club.advisor && (
            <p className="text-sm text-muted-foreground mt-1">
              Advisor: {club.advisor}
            </p>
          )}
        </div>

        {club.tags && club.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {club.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {club.nextEvent && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Next Event</p>
            <h4 className="text-sm">{club.nextEvent.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(club.nextEvent.startAt)}</span>
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

function ClubCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="pt-2 border-t space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function MyClubs({ clubs, isLoading = false }: MyClubsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Clubs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <ClubCardSkeleton key={idx} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clubs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Clubs</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="You're not in any clubs yet"
            description="Join clubs to connect with like-minded students."
            action={<Button>Find Clubs</Button>}
            icon={<Users className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">My Clubs</CardTitle>
        <Button variant="ghost" size="sm">
          Manage Clubs
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
