import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdvisorDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  // Placeholder advisor view for overseeing assigned clubs
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Advisor Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Assigned Clubs</h2>
          <p className="text-sm text-muted-foreground">
            Manage club members and leadership.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Event Drafts</h2>
          <p className="text-sm text-muted-foreground">
            Approve or reject club event drafts.
          </p>
        </div>
      </div>
    </div>
  );
}
