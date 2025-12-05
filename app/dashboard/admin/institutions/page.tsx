import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getAdminInstitutionStats,
  getAdminInstitutionList,
} from "@/lib/repos/institution";
import { AdminInstitutionsPage } from "./_components/admin-institutions-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Institution Management",
  description: "Super Admin Institution Management",
};
export const revalidate = 60; // ISR for stats

export default async function AdminInstitutionsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "super_admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const [stats, institutions] = await Promise.all([
    getAdminInstitutionStats(),
    getAdminInstitutionList(params.status || "all", params.search),
  ]);

  return (
    <AdminInstitutionsPage
      stats={stats}
      institutions={institutions}
      initialStatus={params.status || "all"}
      initialSearch={params.search || ""}
    />
  );
}

