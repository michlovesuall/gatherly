import { getSidebarFor } from "@/lib/sidebar-config";
import type { SidebarConfig, BadgeCounts } from "@/types/nav";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Sidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavUser } from "@/components/app-user";
import { SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { AppSidebar as LegacyAppSidebar } from "@/components/app-sidebar";
import EmployeeSideBar from "@/components/employee/sidebar";

// use shared getCurrentUser to include employee scope and clubs immediately after login

function SidebarNavClient({
  config,
  activePath,
  badgeCounts,
}: {
  config: SidebarConfig;
  activePath: string;
  badgeCounts?: BadgeCounts;
}) {
  return (
    <SidebarContent>
      <ScrollArea className="h-[calc(100svh-8rem)]">
        {config.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.title ? (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            ) : null}
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive =
                  activePath === item.href ||
                  activePath.startsWith(item.href + "/");
                const count = item.badgeCountKey
                  ? badgeCounts?.[item.badgeCountKey]
                  : undefined;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        {item.icon ? <item.icon /> : null}
                        <span>{item.label}</span>
                        {typeof count === "number" && count > 0 ? (
                          <span className="ml-auto inline-flex items-center rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                            {count}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </ScrollArea>
    </SidebarContent>
  );
}

export default async function RoleSidebar({
  badgeCounts,
}: {
  badgeCounts?: BadgeCounts;
}) {
  const user = await getCurrentUser();
  if (!user) {
    // fallback to legacy client sidebar which fetches session client-side
    return <LegacyAppSidebar />;
  }

  // For employees, use the client-side component to support dynamic club loading
  if (user.platformRole === "employee") {
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
          <ScrollArea className="h-[calc(100svh-8rem)]">
            <EmployeeSideBar />
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              name: user.name,
              email: "",
              avatar: user.avatarUrl,
              role: user.platformRole,
            }}
          />
        </SidebarFooter>
      </Sidebar>
    );
  }

  const config = getSidebarFor(user);
  const pathname = ""; // server can't access usePathname; highlight handled client-side via Link styles
  return (
    <Sidebar>
      <SidebarHeader className="mt-4">
        <SidebarMenu className="flex items-center">
          <SidebarMenuItem className="text-2xl font-bold">
            Gatherly
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarNavClient
        config={config}
        activePath={pathname}
        badgeCounts={badgeCounts}
      />
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: "",
            avatar: user.avatarUrl,
            role: user.platformRole,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
