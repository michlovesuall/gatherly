"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Newspaper,
  Calendar,
  Users,
  ClipboardCheck,
  Shield,
  Building2,
  Loader2,
  CalendarCheck,
  Award,
  Settings,
} from "lucide-react";

interface EmployeeScope {
  isStaff: boolean;
  isAdvisor: boolean;
  advisorClubIds: string[];
}

interface User {
  employeeScope?: EmployeeScope;
}

interface AdvisorClub {
  clubId: string;
  clubName: string;
  acronym?: string;
  logo?: string;
}

export default function EmployeeSideBar() {
  const [user, setUser] = useState<User | null>(null);
  const [clubs, setClubs] = useState<AdvisorClub[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);

    async function fetchUser() {
      try {
        console.log("Fetching user session...");
        const response = await fetch("/api/auth/session");
        console.log("Session response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Session data:", data);
          if (data.user) {
            setUser(data.user);
            console.log("User set:", {
              userId: data.user.userId,
              role: data.user.role,
              employeeScope: data.user.employeeScope,
            });

            // Fetch advisor clubs if user is an advisor
            if (data.user.employeeScope?.isAdvisor) {
              console.log("User is advisor, fetching clubs...", {
                isAdvisor: data.user.employeeScope.isAdvisor,
                advisorClubIds: data.user.employeeScope.advisorClubIds,
              });
              setIsLoadingClubs(true);
              setClubsError(null);
              try {
                const clubsResponse = await fetch("/api/employee/clubs");
                console.log("Clubs API response status:", clubsResponse.status);
                if (clubsResponse.ok) {
                  const clubsData = await clubsResponse.json();
                  console.log("Clubs response:", clubsData);
                  if (clubsData.ok && clubsData.clubs) {
                    console.log("Setting clubs:", clubsData.clubs);
                    setClubs(clubsData.clubs);
                  } else {
                    console.error(
                      "Failed to load clubs - invalid response:",
                      clubsData
                    );
                    setClubsError("Failed to load clubs");
                  }
                } else {
                  const errorData = await clubsResponse
                    .json()
                    .catch(() => ({}));
                  console.error(
                    "Failed to load clubs - HTTP error:",
                    clubsResponse.status,
                    errorData
                  );
                  setClubsError("Failed to load clubs");
                }
              } catch (error) {
                console.error("Failed to fetch clubs:", error);
                setClubsError("Failed to load clubs");
              } finally {
                setIsLoadingClubs(false);
              }
            } else {
              console.log("User is not an advisor", {
                employeeScope: data.user.employeeScope,
                role: data.user.role,
              });
            }
          } else {
            console.log("No user in session data");
          }
        } else {
          console.error("Session response not OK:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }

    fetchUser();
  }, []);

  // Always render the base structure to prevent hydration mismatch
  // Only show content after component is mounted on client
  const isAdvisor = mounted && (user?.employeeScope?.isAdvisor ?? false);
  const isStaff = mounted && user?.employeeScope?.isStaff === true;

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Employee</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/employee/newsfeed">
                  <Newspaper />
                  <span>Newsfeed</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/employee/newsfeed#events">
                  <Calendar />
                  <span>Events</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/employee/my-events">
                  <CalendarCheck />
                  <span>My Events</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/employee/clubs">
                  <Building2 />
                  <span>Clubs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/employee/certificates">
                  <Award />
                  <span>Certificates</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isAdvisor && (
        <SidebarGroup suppressHydrationWarning>
          <SidebarGroupLabel>Advisor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingClubs ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading clubs...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : clubsError ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-xs text-muted-foreground">
                      {clubsError}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : clubs.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-xs text-muted-foreground">
                      No clubs assigned
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                clubs.map((club) => (
                  <SidebarMenuItem key={club.clubId}>
                    <SidebarMenuButton asChild>
                      <Link href={`/dashboard/employee/clubs/${club.clubId}`}>
                        <Building2 />
                        <span>{club.acronym || club.clubName}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {isStaff && (
        <SidebarGroup suppressHydrationWarning>
          <SidebarGroupLabel>Staff</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/employee/events">
                    <Calendar />
                    <span>Manage Events</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/employee/clubs">
                    <Users />
                    <span>Manage Clubs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/employee/manage">
                    <Shield />
                    <span>Moderation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/employee/approvals">
                    <ClipboardCheck />
                    <span>Approvals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/employee/settings">
                    <Settings />
                    <span>Institution Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
