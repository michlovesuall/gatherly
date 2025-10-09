"use client";

import { ChevronRight, UserRound } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

// Type definitions for clarity
interface SubMenuItem {
  title: string;
  url: string;
}

interface MenuItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive?: boolean;
  items?: SubMenuItem[];
  subItems?: SubMenuItem[];
}

interface AppItem {
  application: string;
  subItems: MenuItem[];
}

const appItems: AppItem[] = [
  {
    application: "Dashboard",
    subItems: [
      {
        title: "Staff Dashboard",
        url: "#",
        icon: UserRound,
        isActive: true,
        items: [
          { title: "Institution Events", url: "#" },
          { title: "Event & Clubs Approval", url: "#" },
          { title: "Post Moderation", url: "#" },
          { title: "Announcements Summary", url: "#" },
        ],
      },
    ],
  },
];

export default function EmployeeSideBar() {
  return (
    <>
      {appItems.map((apps: AppItem) => (
        <SidebarGroup key={apps.application}>
          <SidebarGroupLabel>{apps.application}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {apps.subItems.map((item: MenuItem) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultChecked={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild className="cursor-pointer">
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {(item.items || item.subItems) && (
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {(item.items || item.subItems)?.map(
                          (subItem: SubMenuItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
