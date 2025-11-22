import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getInstitutionSpecificStats } from "@/lib/repos/institution";
import { InstitutionDashboard } from "./_components/institution-dashboard";
import { runQuery } from "@/lib/neo4j";

export const revalidate = 60; // ISR for dashboard stats

export default async function InstitutionDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institution") {
    redirect("/dashboard");
  }

  // Get institution ID from session (for institution role, userId is the institutionId)
  const institutionId = session.institutionId || session.userId;

  if (!institutionId) {
    redirect("/login");
  }

  // Fetch stats and institution name in parallel
  const [stats, institutionResult] = await Promise.all([
    getInstitutionSpecificStats(institutionId),
    runQuery<{ name: string }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN coalesce(i.name, i.institutionName, "") AS name
      LIMIT 1
      `,
      { institutionId }
    ),
  ]);

  const institutionName =
    institutionResult[0]?.name || session.name || undefined;

  return (
    <InstitutionDashboard stats={stats} institutionName={institutionName} />
  );
}

