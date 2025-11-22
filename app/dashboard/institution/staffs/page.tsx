import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getInstitutionStaffStats,
  getInstitutionApprovedEmployees,
  getInstitutionStaffs,
} from "@/lib/repos/institution";
import { InstitutionStaffsPage } from "./_components/institution-staffs-page";

export const revalidate = 60; // ISR for stats

export default async function InstitutionStaffsPageRoute({
  searchParams,
}: {
  searchParams: Promise<{
    employeesPage?: string;
    employeesPageSize?: string;
    employeesSearch?: string;
    employeesSortBy?: string;
    employeesSortOrder?: string;
    staffsPage?: string;
    staffsPageSize?: string;
    staffsSearch?: string;
    staffsSortBy?: string;
    staffsSortOrder?: string;
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
  const employeesPage = parseInt(params.employeesPage || "1", 10);
  const employeesPageSize = parseInt(params.employeesPageSize || "10", 10);
  const employeesSortBy = (params.employeesSortBy || "name") as "name" | "email";
  const employeesSortOrder = (params.employeesSortOrder || "asc") as "asc" | "desc";

  const staffsPage = parseInt(params.staffsPage || "1", 10);
  const staffsPageSize = parseInt(params.staffsPageSize || "10", 10);
  const staffsSortBy = (params.staffsSortBy || "name") as "name" | "email";
  const staffsSortOrder = (params.staffsSortOrder || "asc") as "asc" | "desc";

  // Fetch all data in parallel
  const [stats, employees, staffs] = await Promise.all([
    getInstitutionStaffStats(institutionId),
    getInstitutionApprovedEmployees(
      institutionId,
      params.employeesSearch,
      employeesPage,
      employeesPageSize,
      employeesSortBy,
      employeesSortOrder
    ),
    getInstitutionStaffs(
      institutionId,
      params.staffsSearch,
      staffsPage,
      staffsPageSize,
      staffsSortBy,
      staffsSortOrder
    ),
  ]);

  return (
    <InstitutionStaffsPage
      stats={stats}
      employees={employees.employees}
      employeesTotal={employees.total}
      employeesPage={employeesPage}
      employeesPageSize={employeesPageSize}
      employeesSearch={params.employeesSearch || ""}
      employeesSortBy={employeesSortBy}
      employeesSortOrder={employeesSortOrder}
      staffs={staffs.staffs}
      staffsTotal={staffs.total}
      staffsPage={staffsPage}
      staffsPageSize={staffsPageSize}
      staffsSearch={params.staffsSearch || ""}
      staffsSortBy={staffsSortBy}
      staffsSortOrder={staffsSortOrder}
    />
  );
}

