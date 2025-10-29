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
  LayoutDashboard,
  Landmark,
  UsersRound,
  Building2,
  CalendarCheck2,
  Megaphone,
  Activity,
  MessageSquareWarning,
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
      title: "Dashboard",
      items: [
        {
          key: "overview",
          label: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Users",
      items: [
        {
          key: "users",
          label: "Directory",
          href: "/dashboard/institution/users",
          icon: UsersRound,
        },
        {
          key: "verification",
          label: "Verifications",
          href: "/dashboard/institution/users/verification",
          icon: ClipboardCheck,
          badgeCountKey: "approvals",
        },
        {
          key: "advisors",
          label: "Advisors",
          href: "/dashboard/institution/advisors",
          icon: Users,
        },
      ],
    },
    {
      title: "Clubs & Orgs",
      items: [
        {
          key: "clubs",
          label: "Manage Clubs",
          href: "/dashboard/institution/clubs",
          icon: Building2,
        },
        {
          key: "club-approvals",
          label: "Club Approvals",
          href: "/dashboard/institution/clubs/approvals",
          icon: ClipboardCheck,
          badgeCountKey: "approvals",
        },
      ],
    },
    {
      title: "Events",
      items: [
        {
          key: "events",
          label: "Manage Events",
          href: "/dashboard/institution/events",
          icon: CalendarCheck2,
        },
        {
          key: "event-approvals",
          label: "Event Approvals",
          href: "/dashboard/institution/events/approvals",
          icon: ClipboardCheck,
          badgeCountKey: "approvals",
        },
      ],
    },
    {
      title: "Announcements",
      items: [
        {
          key: "announcements",
          label: "Announcements",
          href: "/dashboard/institution/announcements",
          icon: Megaphone,
        },
      ],
    },
    {
      title: "Moderation",
      items: [
        {
          key: "moderation",
          label: "Content Moderation",
          href: "/dashboard/institution/moderation",
          icon: MessageSquareWarning,
        },
        {
          key: "policies",
          label: "Policies & Guidelines",
          href: "/dashboard/institution/policies",
          icon: Shield,
        },
      ],
    },
    {
      title: "Analytics & Logs",
      items: [
        {
          key: "analytics",
          label: "Analytics",
          href: "/dashboard/institution/analytics",
          icon: Activity,
        },
        {
          key: "logs",
          label: "Audit Logs",
          href: "/dashboard/institution/logs",
          icon: Activity,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          key: "settings",
          label: "Institution Settings",
          href: "/dashboard/institution/settings",
          icon: SettingsIcon,
        },
        {
          key: "branding",
          label: "Branding",
          href: "/dashboard/institution/settings/branding",
          icon: Landmark,
        },
      ],
    },
  ];
}

export function superAdminSidebar(): SidebarConfig {
  return [
    {
      title: "Application",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          key: "institutions",
          label: "Institutions",
          href: "/dashboard/admin/institutions",
          icon: Landmark,
        },
        {
          key: "users",
          label: "Users",
          href: "/dashboard/admin/users",
          icon: UsersRound,
        },
        {
          key: "clubs",
          label: "Clubs & Organizations",
          href: "/dashboard/admin/clubs",
          icon: Building2,
        },
        {
          key: "events",
          label: "Events",
          href: "/dashboard/admin/events",
          icon: CalendarCheck2,
        },
        {
          key: "announcements",
          label: "Announcements",
          href: "/dashboard/admin/announcements",
          icon: Megaphone,
        },
      ],
    },
    {
      title: "Moderation",
      items: [
        {
          key: "reports",
          label: "Content & Reports",
          href: "/dashboard/admin/moderation",
          icon: MessageSquareWarning,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          key: "system-settings",
          label: "System Settings",
          href: "/dashboard/admin/settings",
          icon: SettingsIcon,
        },
        {
          key: "audit",
          label: "Audit & Activity Logs",
          href: "/dashboard/admin/audit",
          icon: Activity,
        },
      ],
    },
  ];
}

export function getSidebarFor(u: SessionUser): SidebarConfig {
  if (u.platformRole === "institution") return institutionSidebar();
  if (u.platformRole === "super_admin") return superAdminSidebar();
  if (u.platformRole === "employee") return employeeSidebar(u);
  return studentSidebar(u);
}
