"use client";

import {
  Home,
  School,
  Building2,
  CalendarPlus,
  UserCog,
  Scale,
  Bell,
  Megaphone,
  Settings,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const appManagement = [
  {
    title: "Institution Management",
    url: "#",
    icon: School,
  },
  {
    title: "Club & Organization Management",
    url: "#",
    icon: Building2,
  },
  {
    title: "Event Mangement",
    url: "#",
    icon: CalendarPlus,
  },
  {
    title: "User Management",
    url: "#",
    icon: UserCog,
  },
];
const appItems = [
  {
    title: "Dashboard",
    url: "#",
    icon: Home,
  },
  {
    title: "Announcements",
    url: "#",
    icon: Megaphone,
  },
  {
    title: "Notifications",
    url: "#",
    icon: Bell,
  },
];
const appSettings = [
  {
    title: "Moderation and Compliance",
    url: "#",
    icon: Scale,
  },
  {
    title: "Settings & Policies",
    url: "#",
    icon: Settings,
  },
];

export default function AdminSideBar() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {appItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Management</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {appManagement.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {appSettings.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
