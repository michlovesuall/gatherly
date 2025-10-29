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

interface ChildLink {
  title: string;
  url: string;
}

interface SectionItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive?: boolean;
  children?: ChildLink[];
}

interface Section {
  application: string;
  items: SectionItem[];
}

const sections: Section[] = [
  {
    application: "Application",
    items: [
      {
        title: "Dashboard",
        url: "#",
        icon: LayoutDashboard,
        children: [
          { title: "Institution Overview", url: "#" },
          { title: "Recent Activities", url: "#" },
          { title: "Reports Overview", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Management",
    items: [
      {
        title: "Users",
        url: "#",
        icon: UsersRound,
        children: [
          { title: "User Overview", url: "#" },
          { title: "Verification & Control", url: "#" },
          { title: "Role Assignment", url: "#" },
        ],
      },
      {
        title: "Clubs & Organization",
        url: "#",
        icon: Building2,
        children: [
          { title: "Club Overview", url: "#" },
          { title: "Club Approval & Moderation", url: "#" },
          { title: "Club Profile", url: "#" },
        ],
      },
      {
        title: "Events",
        url: "#",
        icon: CalendarCheck2,
        children: [
          { title: "Event Overview", url: "#" },
          { title: "Event Approval Queue", url: "#" },
          { title: "Attendance & Feedback", url: "#" },
        ],
      },
      {
        title: "Announcements",
        url: "#",
        icon: Megaphone,
        children: [
          { title: "Announcement Overview", url: "#" },
          { title: "Institution Announcements", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Feedback",
    items: [
      {
        title: "Feedback & Certificates",
        url: "#",
        icon: MessageCircleQuestionMark,
        children: [
          { title: "Feedback Dashboard", url: "#" },
          { title: "Certificate Overview", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Content Moderation",
    items: [
      {
        title: "Moderation and Reports",
        url: "#",
        icon: MessageSquareWarning,
        children: [
          { title: "Report Content", url: "#" },
          { title: "Institution Audit Logs", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Institution Settings",
    items: [
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        children: [
          { title: "Profile Settings", url: "#" },
          { title: "Institution Preferences", url: "#" },
        ],
      },
    ],
  },
  {
    application: "Logs",
    items: [
      {
        title: "Audit & Activity History",
        url: "#",
        icon: Logs,
        children: [
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
      {sections.map((section) => (
        <SidebarGroup key={section.application}>
          <SidebarGroupLabel>{section.application}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
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
                        {item.children && item.children.length > 0 && (
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children?.map((child) => (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={child.url}>
                                <span>{child.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
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
