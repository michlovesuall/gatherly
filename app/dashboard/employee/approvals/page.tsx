import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EmployeeApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Event & Club Approvals</h1>
      <div className="rounded-lg border p-4">
        Approval queue will appear here.
      </div>
    </div>
  );
}
