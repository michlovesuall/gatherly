"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SidebarTriggerWrapper() {
  const pathname = usePathname();
  const isNewsfeed = pathname?.includes("/newsfeed");
  const isClubDetail = pathname?.match(/\/(student|employee)\/clubs\/[^/]+$/);

  if (isNewsfeed || isClubDetail) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <SidebarTrigger className="cursor-pointer" />
    </div>
  );
}

