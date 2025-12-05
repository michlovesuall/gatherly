import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getAdminClubStats,
  getAdminClubList,
  getApprovedInstitutionOptions,
} from "@/lib/repos/admin-clubs";
import { AdminClubsPage } from "./_components/admin-clubs-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Clubs Management",
  description: "Super Admin Clubs Management",
};
export const revalidate = 60; // ISR for stats

export default async function AdminClubsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    institution?: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "super_admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const [stats, clubs, institutions] = await Promise.all([
    getAdminClubStats(),
    getAdminClubList(params.status || "all", params.search, params.institution),
    getApprovedInstitutionOptions(),
  ]);

  return (
    <AdminClubsPage
      stats={stats}
      clubs={clubs}
      institutions={institutions}
      initialStatus={params.status || "all"}
      initialSearch={params.search || ""}
      initialInstitution={params.institution || "all"}
    />
  );
}
