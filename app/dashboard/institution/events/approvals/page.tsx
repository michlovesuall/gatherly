import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getInstitutionPendingEvents } from "@/lib/repos/institution";
import { InstitutionEventsApprovalsPage } from "./_components/institution-events-approvals-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Event Approvals",
  description: "Institution Event Approvals",
};
export const revalidate = 60;

export default async function InstitutionEventsApprovalsPageRoute({
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
    const events = await getInstitutionPendingEvents(
      institutionId,
      params.search
    );

    return (
      <InstitutionEventsApprovalsPage
        events={events}
        initialSearch={params.search || ""}
        institutionId={institutionId}
      />
    );
  } catch (error) {
    console.error("Error fetching pending events:", error);
    return (
      <InstitutionEventsApprovalsPage
        events={[]}
        initialSearch={params.search || ""}
        institutionId={institutionId}
      />
    );
  }
}
