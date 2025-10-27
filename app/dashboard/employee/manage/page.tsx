import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EmployeeManagePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  // Placeholder UI for staff institutional management
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Institution Management</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Institution Events</h2>
          <p className="text-sm text-muted-foreground">
            Approve, edit, delete events.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Club Postings</h2>
          <p className="text-sm text-muted-foreground">
            Moderate club posts & announcements.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Approvals</h2>
          <p className="text-sm text-muted-foreground">
            Approve/reject event drafts.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Announcements</h2>
          <p className="text-sm text-muted-foreground">
            Overview of institution announcements.
          </p>
        </div>
      </div>
    </div>
  );
}
