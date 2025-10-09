"use client";

import {
  ChevronRight,
  LayoutDashboard,
  Logs,
  MessageCircleQuestionMark,
  UsersRound,
  Building2,
  CalendarCheck2,
  Megaphone,
  MessageSquareWarning,
  Settings,
} from "lucide-react";
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
    application: "Application",
    subItems: [
      {
        title: "Dashboard",
        url: "#",
        icon: LayoutDashboard,
        items: [
          { title: "Institution Overview", url: "#" },
          { title: "Recent Activities", url: "#" },
          { title: "Reports Overview", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Management",
    subItems: [
      {
        title: "Users",
        url: "#",
        icon: UsersRound,
        items: [
          { title: "User Overview", url: "#" },
          { title: "Verification & Control", url: "#" },
          { title: "Role Assignment", url: "#" },
        ],
      },
      {
        title: "Clubs & Organization",
        url: "#",
        icon: Building2,
        items: [
          { title: "Club Overview", url: "#" },
          { title: "Club Approval & Moderation", url: "#" },
          { title: "Club Profile", url: "#" },
        ],
      },
      {
        title: "Events",
        url: "#",
        icon: CalendarCheck2,
        items: [
          { title: "Event Overview", url: "#" },
          { title: "Event Approval Queue", url: "#" },
          { title: "Attendance & Feedback", url: "#" },
        ],
      },
      {
        title: "Announcements",
        url: "#",
        icon: Megaphone,
        items: [
          { title: "Announcement Overview", url: "#" },
          { title: "Insitution Announcements", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Feedback",
    subItems: [
      {
        title: "Feedback & Certificates",
        url: "#",
        icon: MessageCircleQuestionMark,
        items: [
          { title: "Feedback Dashboard", url: "#" },
          { title: "Certificate Overview", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Content Moderation",
    subItems: [
      {
        title: "Moderation and Reports",
        url: "#",
        icon: MessageSquareWarning,
        items: [
          { title: "Report Content", url: "#" },
          { title: "Institution Audit Logs", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Insitution Settings",
    subItems: [
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        items: [
          { title: "Profile Settings", url: "#" },
          { title: "Institution Preferences", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Logs",
    subItems: [
      {
        title: "Audit & Activity History",
        url: "#",
        icon: Logs,
        items: [
          { title: "Activity Log", url: "#" },
          { title: "Audit Export", url: "#" },
        ],
      },
    ],
  },
];

export default function InstitutionSideBar() {
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
