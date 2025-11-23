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
  Rss,
} from "lucide-react";

export function studentSidebar(u: SessionUser): SidebarConfig {
  const base: SidebarConfig = [
    {
      items: [
        {
          key: "newsfeed",
          label: "Newsfeed",
          href: "/dashboard/student/newsfeed",
          icon: Rss,
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

  // Add "My Club" group if student belongs to any clubs
  const studentClubs = (u.clubs ?? []).filter((c) => c.role === "member" || c.role === "officer");
  if (studentClubs.length > 0) {
    base.push({
      title: "My Club",
      items: studentClubs.map((club) => ({
        key: `club-${club.clubId}`,
        label: club.clubAcronym || club.clubName,
        href: `/dashboard/student/clubs/${club.clubId}`,
        icon: Building2,
      })),
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
          key: "newsfeed",
          label: "Newsfeed",
          href: "/dashboard/employee/newsfeed",
          icon: Newspaper,
        },
        {
          key: "events",
          label: "Events",
          href: "/dashboard/employee/newsfeed#events",
          icon: Calendar,
        },
        {
          key: "my-events",
          label: "My Events",
          href: "/dashboard/employee/my-events",
          icon: CalendarCheck,
        },
        {
          key: "clubs",
          label: "Clubs",
          href: "/dashboard/employee/clubs",
          icon: Building2,
        },
        {
          key: "certificates",
          label: "Certificates",
          href: "/dashboard/employee/certificates",
          icon: Award,
        },
      ],
    },
  ];

  // Add Advisor section if user is an advisor
  if (u.employeeScope?.isAdvisor) {
    // Note: Club names are dynamically loaded client-side
    // The advisorClubIds are available in u.employeeScope.advisorClubIds
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
  }

  // Add Staff section if user is staff
  if (u.employeeScope?.isStaff) {
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
        {
          key: "institution-settings",
          label: "Institution Settings",
          href: "/dashboard/employee/settings",
          icon: SettingsIcon,
        },
      ],
    });
  }

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
        {
          key: "newsfeed",
          label: "Newsfeed",
          href: "/dashboard/institution/newsfeed",
          icon: Rss,
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
          key: "staffs",
          label: "Staffs",
          href: "/dashboard/institution/staffs",
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
      title: "Dashboard",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          href: "/dashboard/admin",
          icon: LayoutDashboard,
        },
        {
          key: "newsfeed",
          label: "Newsfeed",
          href: "/dashboard/admin/newsfeed",
          icon: Rss,
        },
      ],
    },
    {
      title: "Tenants & Access",
      items: [
        {
          key: "users",
          label: "All Users",
          href: "/dashboard/admin/users",
          icon: UsersRound,
        },
        {
          key: "institutions",
          label: "Institutions",
          href: "/dashboard/admin/institutions",
          icon: Landmark,
        },
        // {
        //   key: "suspended-tenants",
        //   label: "Suspended Tenants",
        //   href: "/dashboard/admin/institutions/suspended",
        //   icon: Shield,
        // },
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
      ],
    },
    // {
    //   title: "Moderation & Compliance",
    //   items: [
    //     {
    //       key: "reports",
    //       label: "Content Moderation",
    //       href: "/dashboard/admin/moderation",
    //       icon: MessageSquareWarning,
    //     },
    //     {
    //       key: "announcements",
    //       label: "Global Announcements",
    //       href: "/dashboard/admin/announcements",
    //       icon: Megaphone,
    //     },
    //   ],
    // },
    // {
    //   title: "Analytics & Logs",
    //   items: [
    //     {
    //       key: "analytics",
    //       label: "Cross-Tenant Analytics",
    //       href: "/dashboard/admin/analytics",
    //       icon: Activity,
    //     },
    //     {
    //       key: "audit",
    //       label: "Audit & Activity Logs",
    //       href: "/dashboard/admin/audit",
    //       icon: Activity,
    //     },
    //   ],
    // },
    // {
    //   title: "Policies & Config",
    //   items: [
    //     {
    //       key: "policies",
    //       label: "Platform Policies",
    //       href: "/dashboard/admin/policies",
    //       icon: Shield,
    //     },
    //     {
    //       key: "feature-flags",
    //       label: "Feature Flags",
    //       href: "/dashboard/admin/feature-flags",
    //       icon: SettingsIcon,
    //     },
    //     {
    //       key: "providers",
    //       label: "Provider Keys",
    //       href: "/dashboard/admin/providers",
    //       icon: SettingsIcon,
    //     },
    //   ],
    // },
    {
      title: "Settings",
      items: [
        {
          key: "system-settings",
          label: "System Settings",
          href: "/dashboard/admin/settings",
          icon: SettingsIcon,
        },
        // {
        //   key: "my-profile",
        //   label: "My Profile",
        //   href: "/dashboard/settings",
        //   icon: Users,
        // },
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
