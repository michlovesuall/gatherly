import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { runQuery } from "@/lib/neo4j";
import {
  getInstitutionSettingsStats,
  getInstitutionColleges,
  getInstitutionDepartments,
  getInstitutionPrograms,
} from "@/lib/repos/institution";
import { InstitutionSettingsPage } from "./_components/institution-settings-page";

export const revalidate = 60; // ISR for stats

export default async function InstitutionSettingsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    collegesPage?: string;
    collegesPageSize?: string;
    collegesSearch?: string;
    collegesSortBy?: string;
    collegesSortOrder?: string;
    departmentsPage?: string;
    departmentsPageSize?: string;
    departmentsSearch?: string;
    departmentsSortBy?: string;
    departmentsSortOrder?: string;
    programsPage?: string;
    programsPageSize?: string;
    programsSearch?: string;
    programsSortBy?: string;
    programsSortOrder?: string;
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
  const collegesPage = parseInt(params.collegesPage || "1", 10);
  const collegesPageSize = parseInt(params.collegesPageSize || "10", 10);
  const collegesSearch = params.collegesSearch || "";
  const collegesSortBy = (params.collegesSortBy || "name") as "name";
  const collegesSortOrder = (params.collegesSortOrder || "asc") as "asc" | "desc";

  const departmentsPage = parseInt(params.departmentsPage || "1", 10);
  const departmentsPageSize = parseInt(params.departmentsPageSize || "10", 10);
  const departmentsSearch = params.departmentsSearch || "";
  const departmentsSortBy = (params.departmentsSortBy || "name") as "name";
  const departmentsSortOrder = (params.departmentsSortOrder || "asc") as "asc" | "desc";

  const programsPage = parseInt(params.programsPage || "1", 10);
  const programsPageSize = parseInt(params.programsPageSize || "10", 10);
  const programsSearch = params.programsSearch || "";
  const programsSortBy = (params.programsSortBy || "name") as "name";
  const programsSortOrder = (params.programsSortOrder || "asc") as "asc" | "desc";

  // Get institution name
  const institutionResult = await runQuery<{ name: string }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN coalesce(i.name, i.institutionName, "") AS name
    LIMIT 1
    `,
    { institutionId }
  );

  const institutionName =
    institutionResult[0]?.name || session.name || "Institution";

  // Fetch all data in parallel
  const [stats, colleges, departments, programs] = await Promise.all([
    getInstitutionSettingsStats(institutionId),
    getInstitutionColleges(
      institutionId,
      collegesSearch || undefined,
      collegesPage,
      collegesPageSize,
      collegesSortBy,
      collegesSortOrder
    ),
    getInstitutionDepartments(
      institutionId,
      departmentsSearch || undefined,
      departmentsPage,
      departmentsPageSize,
      departmentsSortBy,
      departmentsSortOrder
    ),
    getInstitutionPrograms(
      institutionId,
      programsSearch || undefined,
      programsPage,
      programsPageSize,
      programsSortBy,
      programsSortOrder
    ),
  ]);

  return (
    <InstitutionSettingsPage
      stats={stats}
      institutionName={institutionName}
      colleges={colleges.colleges}
      collegesTotal={colleges.total}
      collegesPage={collegesPage}
      collegesPageSize={collegesPageSize}
      collegesSearch={collegesSearch}
      collegesSortBy={collegesSortBy}
      collegesSortOrder={collegesSortOrder}
      departments={departments.departments}
      departmentsTotal={departments.total}
      departmentsPage={departmentsPage}
      departmentsPageSize={departmentsPageSize}
      departmentsSearch={departmentsSearch}
      departmentsSortBy={departmentsSortBy}
      departmentsSortOrder={departmentsSortOrder}
      programs={programs.programs}
      programsTotal={programs.total}
      programsPage={programsPage}
      programsPageSize={programsPageSize}
      programsSearch={programsSearch}
      programsSortBy={programsSortBy}
      programsSortOrder={programsSortOrder}
    />
  );
}

