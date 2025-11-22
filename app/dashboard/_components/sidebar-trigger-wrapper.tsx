"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SidebarTriggerWrapper() {
  const pathname = usePathname();
  const isNewsfeed = pathname?.includes("/newsfeed");

  if (isNewsfeed) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <SidebarTrigger className="cursor-pointer" />
    </div>
  );
}

