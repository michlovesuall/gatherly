"use client";

import * as React from "react";
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

// Menu items.

export function AppSidebar() {
  const user = {
    name: "Michael Amata",
    email: "username@example.com",
    role: "employee",
    avatar: "https://github.com/shadcn.png",
  };

  let content;

  if (user.role === "employee") {
    content = <EmployeeSideBar />;
  } else if (user.role === "institution") {
    content = <InstitutionSideBar />;
  } else if (user.role === "admin") {
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
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
