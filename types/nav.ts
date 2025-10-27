import type { SessionUser } from "@/lib/rbac";

export type BadgeKey = "approvals" | "rsvps" | "pending";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  badgeCountKey?: BadgeKey;
};

export type SidebarSection = { title?: string; items: NavItem[] };
export type SidebarConfig = SidebarSection[];

export type BadgeCounts = Partial<Record<BadgeKey, number>>;

export type SidebarBuilder = (u: SessionUser) => SidebarConfig;
