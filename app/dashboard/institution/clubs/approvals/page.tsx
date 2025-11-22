import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getInstitutionPendingClubs } from "@/lib/repos/institution";
import { InstitutionClubsApprovalsPage } from "./_components/institution-clubs-approvals-page";

export const revalidate = 60; // ISR for stats

export default async function InstitutionClubsApprovalsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
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

  try {
    // Fetch pending clubs
    const clubs = await getInstitutionPendingClubs(
      institutionId,
      params.search
    );

    return (
      <InstitutionClubsApprovalsPage
        clubs={clubs}
        initialSearch={params.search || ""}
        institutionId={institutionId}
        institutionName={session.name || "Institution"}
      />
    );
  } catch (error) {
    console.error("Error fetching pending clubs:", error);
    // Return empty array on error to prevent page crash
    return (
      <InstitutionClubsApprovalsPage
        clubs={[]}
        initialSearch={params.search || ""}
      />
    );
  }
}

