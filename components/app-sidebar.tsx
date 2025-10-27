"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSideBar from "@/components/admin/sidebar";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/app-user";
import EmployeeSideBar from "./employee/sidebar";
import InstitutionSideBar from "./institution/sidebar";
import StudentSideBar from "./student/sidebar";

interface User {
  name: string;
  email: string;
  role:
    | "student"
    | "employee"
    | "admin"
    | "institution"
    | "super_admin"
    | "staff";
  avatar?: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>({
    name: "User",
    email: "",
    role: "student",
    avatar: undefined,
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({
              name: data.user.name || "User",
              email: data.user.email || "",
              role: (data.user.role as User["role"]) || "student",
              avatar: data.user.avatar,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [pathname]);

  let content;

  if (user.role === "employee" || user.role === "staff") {
    content = <EmployeeSideBar />;
  } else if (user.role === "institution") {
    content = <InstitutionSideBar />;
  } else if (user.role === "admin" || user.role === "super_admin") {
    content = <AdminSideBar />;
  } else {
    content = <StudentSideBar />;
  }

  return (
    <Sidebar>
      <SidebarHeader className="mt-4">
        <SidebarMenu className="flex items-center">
          <SidebarMenuItem className="text-2xl font-bold">
            Gatherly
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{content}</SidebarContent>
      <SidebarFooter>{!isLoading && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
