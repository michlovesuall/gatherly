import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import RoleSidebar from "@/components/sidebar/Sidebar";
import { SidebarTriggerWrapper } from "./_components/sidebar-trigger-wrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RoleSidebar />
      <SidebarInset className="overflow-x-hidden">
        <SidebarTriggerWrapper />
        <div className="overflow-x-hidden max-w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
