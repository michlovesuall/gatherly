import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getInstitutionEventStats,
  getInstitutionEvents,
  getInstitutionClubsForDropdown,
} from "@/lib/repos/institution";
import { InstitutionEventsPage } from "./_components/institution-events-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Events",
  description: "Institution Events",
};
export const revalidate = 60; // ISR for stats

export default async function InstitutionEventsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
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

  // Fetch stats, events, and clubs in parallel
  const [stats, eventsData, clubs] = await Promise.all([
    getInstitutionEventStats(institutionId),
    getInstitutionEvents(institutionId, {
      status: params.status || "all",
      search: params.search,
      sortBy: (params.sortBy || "createdAt") as "createdAt" | "startAt" | "status",
      sortOrder: (params.sortOrder || "desc") as "asc" | "desc",
      page: 1,
      pageSize: 50,
    }),
    getInstitutionClubsForDropdown(institutionId),
  ]);

  return (
    <InstitutionEventsPage
      stats={stats}
      events={eventsData.events}
      total={eventsData.total}
      initialStatus={params.status || "all"}
      initialSearch={params.search || ""}
      initialSortBy={params.sortBy || "createdAt"}
      initialSortOrder={params.sortOrder || "desc"}
      clubs={clubs}
    />
  );
}

