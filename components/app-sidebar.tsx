"use client";

import * as React from "react";
import { Scale } from "lucide-react";
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

// Menu items.

export function AppSidebar() {
  const user = {
    name: "Michael Amata",
    email: "username@example.com",
    role: "employee",
    avatar: "https://github.com/shadcn.png",
  };

  return (
    <Sidebar>
      <SidebarHeader className="mt-4">
        <SidebarMenu className="flex items-center">
          <SidebarMenuItem className="text-2xl font-bold">
            Gatherly
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {user.role === "employee" ? <EmployeeSideBar /> : <AdminSideBar />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
