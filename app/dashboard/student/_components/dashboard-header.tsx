"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export interface DashboardHeaderProps {
  studentName: string;
  institutionName: string;
  avatarUrl?: string;
  stats: { going: number; interested: number; certificates: number };
}

export function DashboardHeader({
  studentName,
  institutionName,
  avatarUrl,
  stats,
}: DashboardHeaderProps) {
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={studentName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">
                {greeting}, {studentName.split(" ")[0]}
              </h1>
              <p className="text-sm text-muted-foreground">{institutionName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold">{stats.going}</div>
              <span className="text-xs text-muted-foreground">Going</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold">{stats.interested}</div>
              <span className="text-xs text-muted-foreground">Interested</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold">{stats.certificates}</div>
              <span className="text-xs text-muted-foreground">
                Certificates
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
