import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getInstitutionUserStats,
  getInstitutionPendingUsers,
  getInstitutionApprovedUsers,
} from "@/lib/repos/institution";
import { runQuery } from "@/lib/neo4j";
import { InstitutionUsersPage } from "./_components/institution-users-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Users",
  description: "Institution Users Directory",
};


export const revalidate = 60; // ISR for stats

export default async function InstitutionUsersPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    pendingPage?: string;
    pendingPageSize?: string;
    pendingSearch?: string;
    pendingUserType?: string;
    approvedPage?: string;
    approvedPageSize?: string;
    approvedSearch?: string;
    approvedUserType?: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institution") {
    redirect("/dashboard");
  }

  const institutionId = session.institutionId || session.userId;

  if (!institutionId) {
    redirect("/login");
  }

  const params = await searchParams;

  // Parse pagination parameters
  const pendingPage = parseInt(params.pendingPage || "1", 10);
  const pendingPageSize = parseInt(params.pendingPageSize || "10", 10);
  const approvedPage = parseInt(params.approvedPage || "1", 10);
  const approvedPageSize = parseInt(params.approvedPageSize || "10", 10);

  // Fetch all data in parallel
  const [stats, pendingUsers, approvedUsers, institutionResult] = await Promise.all([
    getInstitutionUserStats(institutionId),
    getInstitutionPendingUsers(
      institutionId,
      params.pendingSearch,
      params.pendingUserType,
      pendingPage,
      pendingPageSize
    ),
    getInstitutionApprovedUsers(
      institutionId,
      params.approvedSearch,
      params.approvedUserType,
      approvedPage,
      approvedPageSize
    ),
    runQuery<{ name: string; slug?: string }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN coalesce(i.name, i.institutionName, "") AS name, i.slug AS slug
      LIMIT 1
      `,
      { institutionId }
    ),
  ]);

  const institutionName = institutionResult[0]?.name || session.name || "";
  const institutionSlug = institutionResult[0]?.slug || "";

  return (
    <InstitutionUsersPage
      institutionId={institutionId}
      institutionName={institutionName}
      institutionSlug={institutionSlug}
      stats={stats}
      pendingUsers={pendingUsers.users}
      pendingTotal={pendingUsers.total}
      pendingPage={pendingPage}
      pendingPageSize={pendingPageSize}
      pendingSearch={params.pendingSearch || ""}
      pendingUserType={params.pendingUserType || "all"}
      approvedUsers={approvedUsers.users}
      approvedTotal={approvedUsers.total}
      approvedPage={approvedPage}
      approvedPageSize={approvedPageSize}
      approvedSearch={params.approvedSearch || ""}
      approvedUserType={params.approvedUserType || "all"}
    />
  );
}

