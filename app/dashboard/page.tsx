import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const revalidate = 60; // ISR for dashboard stats

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect super_admin to admin dashboard
  if (session.role === "super_admin") {
    redirect("/dashboard/admin");
  }

  // Redirect other roles to their specific dashboards
  if (session.role === "institution") {
    // Institution role should have its own dashboard (to be implemented)
    redirect("/dashboard/institution");
  }

  if (session.role === "student") {
    redirect("/dashboard/student");
  }

  if (session.role === "employee" || session.role === "staff") {
    redirect("/dashboard/employee");
  }

  // Fallback
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">No dashboard available for this role.</p>
    </div>
  );
}
