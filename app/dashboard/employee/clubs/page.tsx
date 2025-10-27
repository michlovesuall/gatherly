import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EmployeeClubsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Clubs</h1>
      <div className="rounded-lg border p-4">
        Club management table goes here.
      </div>
    </div>
  );
}
