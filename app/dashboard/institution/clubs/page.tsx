import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getInstitutionAdvisorStats,
  getInstitutionApprovedClubs,
} from "@/lib/repos/institution";
import { InstitutionAdvisorsPage } from "./_components/institution-advisors-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Clubs",
  description: "Institution Clubs Management",
};
export const revalidate = 60; // ISR for stats

export default async function InstitutionClubsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    advisorStatus?: string;
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

  // Fetch stats and clubs in parallel
  const [stats, clubs] = await Promise.all([
    getInstitutionAdvisorStats(institutionId),
    getInstitutionApprovedClubs(
      institutionId,
      params.search,
      params.advisorStatus
    ),
  ]);

  return (
    <InstitutionAdvisorsPage
      stats={stats}
      clubs={clubs}
      initialSearch={params.search || ""}
      initialAdvisorStatus={params.advisorStatus || "all"}
    />
  );
}
