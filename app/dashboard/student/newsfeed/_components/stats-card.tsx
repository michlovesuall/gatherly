"use client";

import { Card, CardContent } from "@/components/ui/card";

export interface StatsCardProps {
  stats: { going: number; interested: number; certificates: number };
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-around gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-bold">{stats.going}</div>
            <span className="text-xs text-muted-foreground">Going</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-bold">{stats.interested}</div>
            <span className="text-xs text-muted-foreground">Interested</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-bold">{stats.certificates}</div>
            <span className="text-xs text-muted-foreground">Certificates</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

