import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getAdminUserStats,
  getAdminUserList,
  getInstitutionOptions,
} from "@/lib/repos/admin-users";
import { AdminUsersPage } from "./_components/admin-users-page";

export const revalidate = 60; // ISR for stats

export default async function AdminUsersPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    status?: string;
    institution?: string;
    search?: string;
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

  const [stats, users, institutions] = await Promise.all([
    getAdminUserStats(),
    getAdminUserList(
      params.role,
      params.status,
      params.institution,
      params.search
    ),
    getInstitutionOptions(),
  ]);

  return (
    <AdminUsersPage
      stats={stats}
      users={users}
      institutions={institutions}
      initialRole={params.role || "all"}
      initialStatus={params.status || "all"}
      initialInstitution={params.institution || "all"}
      initialSearch={params.search || ""}
    />
  );
}

