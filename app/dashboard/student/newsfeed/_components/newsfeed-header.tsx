"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
    role === "employee" || role === "student"
      ? context.departmentAcronym || context.departmentName || ""
      : ""; // institution and super_admin don't have department/program

  return (
    <div className="sticky top-0 z-50 w-full bg-background border-b">
      <Card className="rounded-none border-x-0 border-t-0 w-full">
        <CardContent className="px-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 px-4 lg:px-6">
            {/* Left Side */}
            <div className="flex items-center gap-2 lg:gap-3">
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

            {/* Middle - Filter Dropdown (Centered) - Only show for Student, Employee, and Institution roles */}
            {role !== "super_admin" && (
              <div className="flex items-center justify-center flex-1">
                {isMounted ? (
                  <Select
                    value={feedFilter}
                    onValueChange={(value) => onFilterChange(value as "for-you" | "global")}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for-you">Institution</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-[140px] h-8 border border-input rounded-md bg-background flex items-center justify-center text-xs text-muted-foreground">
                    {feedFilter === "for-you" ? "Institution" : "Global"}
                  </div>
                )}
              </div>
            )}

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
