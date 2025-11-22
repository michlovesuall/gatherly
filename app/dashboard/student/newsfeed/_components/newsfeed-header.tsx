"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Calendar, Users, Award } from "lucide-react";
import type { NewsfeedContext } from "@/lib/repos/student";

export interface NewsfeedHeaderProps {
  context: NewsfeedContext;
  role: "student" | "employee" | "institution" | "super_admin";
  feedFilter: "for-you" | "global";
  onFilterChange: (filter: "for-you" | "global") => void;
}

export function NewsfeedHeader({
  context,
  role,
  feedFilter,
  onFilterChange,
}: NewsfeedHeaderProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
    );
  }, []);

  const initials = context.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Build department/program text based on role
  const departmentProgramText =
    role === "employee"
      ? context.departmentAcronym || context.departmentName || ""
      : role === "student"
      ? [context.departmentName, context.programName]
          .filter(Boolean)
          .join(" • ")
      : ""; // institution and super_admin don't have department/program

  return (
    <div className="sticky top-0 z-50 bg-background border-b">
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3">
            {/* Left Side */}
            <div className="flex items-center gap-2 lg:gap-3 flex-1">
              <SidebarTrigger className="cursor-pointer" />
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                <AvatarImage src={context.avatarUrl} alt={context.userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-base font-semibold">
                  <span suppressHydrationWarning>{greeting || "Welcome"}</span>,{" "}
                  {context.userName.split(" ")[0]}
                </h1>
                <div className="text-xs text-muted-foreground">
                  {departmentProgramText && (
                    <>
                      <span>{departmentProgramText}</span>
                      {context.institutionName && " • "}
                    </>
                  )}
                  {context.institutionName && (
                    <span>{context.institutionName}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle - Filter Tabs (Centered) */}
            <div className="flex items-center justify-center flex-1">
              <Tabs
                value={feedFilter}
                onValueChange={(v) => onFilterChange(v as "for-you" | "global")}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="for-you" className="text-xs px-3">
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="global" className="text-xs px-3">
                    Global
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center gap-1 flex-1 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 lg:px-3 text-xs"
                onClick={() => {
                  const routeRole = role === "super_admin" ? "admin" : role;
                  router.push(`/dashboard/${routeRole}/events`);
                }}
              >
                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">
                  {role === "institution" || role === "super_admin"
                    ? "Manage Events"
                    : "Browse Events"}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 lg:px-3 text-xs"
                onClick={() => {
                  const routeRole = role === "super_admin" ? "admin" : role;
                  router.push(`/dashboard/${routeRole}/clubs`);
                }}
              >
                <Users className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">
                  {role === "institution" || role === "super_admin"
                    ? "Manage Clubs"
                    : "Find Clubs"}
                </span>
              </Button>
              {(role === "student" || role === "employee") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 lg:px-3 text-xs"
                  onClick={() => router.push(`/dashboard/${role}#certificates`)}
                >
                  <Award className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                  <span className="hidden lg:inline">My Certificates</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
