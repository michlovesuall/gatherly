import type { SidebarConfig } from "@/types/nav";
import type { SessionUser } from "@/lib/rbac";
import {
  Newspaper,
  Calendar,
  CalendarCheck,
  Users,
  Award,
  Settings as SettingsIcon,
  ClipboardCheck,
  Shield,
} from "lucide-react";

export function studentSidebar(u: SessionUser): SidebarConfig {
  const base: SidebarConfig = [
    {
      items: [
        {
          key: "feed",
          label: "Feed",
          href: "/dashboard/student#feed",
          icon: Newspaper,
        },
        {
          key: "events",
          label: "Events",
          href: "/dashboard/student#events",
          icon: Calendar,
        },
        {
          key: "my-events",
          label: "My Events",
          href: "/dashboard/student#my-events",
          badgeCountKey: "rsvps",
          icon: CalendarCheck,
        },
        {
          key: "clubs",
          label: "Clubs",
          href: "/dashboard/student#clubs",
          icon: Users,
        },
        {
          key: "certs",
          label: "Certificates",
          href: "/dashboard/student#certificates",
          icon: Award,
        },
      ],
    },
  ];

  if ((u.clubs ?? []).some((c) => c.role === "officer")) {
    base.push({
      title: "Officer",
      items: [
        { key: "club-tools", label: "Club Tools", href: "/dashboard/officer" },
        {
          key: "drafts",
          label: "Event Drafts",
          href: "/dashboard/officer/drafts",
          badgeCountKey: "pending",
        },
        {
          key: "attendance",
          label: "RSVP & Check-ins",
          href: "/dashboard/officer/attendance",
        },
      ],
    });
  }

  // Account settings removed from sidebar; accessible via user menu
  return base;
}

export function employeeSidebar(u: SessionUser): SidebarConfig {
  const base: SidebarConfig = [
    {
      title: "Employee",
      items: [
        {
          key: "feed",
          label: "Feed",
          href: "/dashboard/employee/feed",
          icon: Newspaper,
        },
        {
          key: "events",
          label: "Events",
          href: "/dashboard/employee/feed#events",
          icon: Calendar,
        },
      ],
    },
  ];

  base.push({
    title: "Advisor",
    items: [
      {
        key: "approvals",
        label: "Approvals",
        href: "/dashboard/employee/approvals",
        badgeCountKey: "approvals",
        icon: ClipboardCheck,
      },
      {
        key: "members",
        label: "Manage Members",
        href: "/dashboard/employee/advisor",
        icon: Users,
      },
    ],
  });
  base.push({
    title: "Staff",
    items: [
      {
        key: "manage-events",
        label: "Manage Events",
        href: "/dashboard/employee/events",
        icon: Calendar,
      },
      {
        key: "manage-clubs",
        label: "Manage Clubs",
        href: "/dashboard/employee/clubs",
        icon: Users,
      },
      {
        key: "moderation",
        label: "Moderation",
        href: "/dashboard/employee/manage",
        icon: Shield,
      },
      {
        key: "staff-approvals",
        label: "Approvals",
        href: "/dashboard/employee/approvals",
        badgeCountKey: "approvals",
        icon: ClipboardCheck,
      },
    ],
  });

  // Account settings removed from sidebar; accessible via user menu
  return base;
}

export function institutionSidebar(): SidebarConfig {
  return [
    {
      items: [
        { key: "overview", label: "Overview", href: "/dashboard" },
        { key: "users", label: "Users", href: "/dashboard/users" },
        { key: "clubs", label: "Clubs", href: "/dashboard/clubs" },
        { key: "events", label: "Events", href: "/dashboard/events" },
        {
          key: "announcements",
          label: "Announcements",
          href: "/dashboard/announcements",
        },
        {
          key: "approvals",
          label: "Approvals",
          href: "/dashboard/approvals",
          badgeCountKey: "approvals",
        },
        { key: "analytics", label: "Analytics", href: "/dashboard/analytics" },
        { key: "settings", label: "Settings", href: "/dashboard/settings" },
      ],
    },
  ];
}

export function getSidebarFor(u: SessionUser): SidebarConfig {
  if (u.platformRole === "institution") return institutionSidebar();
  if (u.platformRole === "employee") return employeeSidebar(u);
  return studentSidebar(u);
}
