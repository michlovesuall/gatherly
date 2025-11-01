import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAdminDashboardStats } from "@/lib/repos/institution";
import { InstitutionDashboard } from "../_components/institution-dashboard";

export const revalidate = 60; // ISR for dashboard stats

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "super_admin") {
    redirect("/dashboard");
  }

  // For super_admin platform role, show platform-wide statistics dashboard
  const stats = await getAdminDashboardStats();
  return <InstitutionDashboard stats={stats} />;
}

