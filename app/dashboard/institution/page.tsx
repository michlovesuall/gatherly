import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function InstitutionDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institution") {
    redirect("/dashboard");
  }

  // Placeholder institution dashboard
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Institution Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your institution dashboard
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Institution dashboard content will be available here.
        </p>
      </div>
    </div>
  );
}

