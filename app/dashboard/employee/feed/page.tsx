import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EmployeeFeedPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Employee Feed</h1>
      <p className="text-sm text-muted-foreground">
        Browse events, RSVP, like, comment, and attend events.
      </p>
      <div className="rounded-lg border p-4">Event feed will appear here.</div>
    </div>
  );
}
