import { runQuery } from "@/lib/neo4j";

export interface InstitutionDashboardStats {
  totalInstitutions: number;
  totalStudents: number;
  totalEmployees: number;
  totalClubs: number;
  approvedInstitutions?: number;
  pendingInstitutions?: number;
}

export interface InstitutionStats {
  registered: number;
  pending: number;
  rejected: number;
}

export interface InstitutionListItem {
  id: string;
  logo?: string;
  name: string;
  contactPersonEmail: string;
  status: string;
  createdAt: string;
}

/**
 * Get platform-wide dashboard statistics for institution role
 * This includes counts of all institutions, students, employees, and clubs
 */
export async function getInstitutionDashboardStats(): Promise<InstitutionDashboardStats> {
  const result = await runQuery<{
    totalInstitutions: number;
    totalStudents: number;
    totalEmployees: number;
    totalClubs: number;
  }>(
    `
    // Count institutions
    MATCH (i:User {platformRole: "institution"})
    WITH COUNT(DISTINCT i) AS totalInstitutions
    
    // Count students - users where platformRole is null, empty, or explicitly "student"
    MATCH (s:User)
    WHERE coalesce(toLower(s.platformRole), "student") = "student"
    WITH totalInstitutions, COUNT(DISTINCT s) AS totalStudents
    
    // Count employees
    MATCH (e:User {platformRole: "employee"})
    WITH totalInstitutions, totalStudents, COUNT(DISTINCT e) AS totalEmployees
    
    // Count clubs
    MATCH (c:Club)
    WITH totalInstitutions, totalStudents, totalEmployees, COUNT(DISTINCT c) AS totalClubs
    
    RETURN totalInstitutions, totalStudents, totalEmployees, totalClubs
    `
  );

  const stats = result[0];
  return {
    totalInstitutions: stats?.totalInstitutions || 0,
    totalStudents: stats?.totalStudents || 0,
    totalEmployees: stats?.totalEmployees || 0,
    totalClubs: stats?.totalClubs || 0,
  };
}

/**
 * Get admin dashboard statistics
 * Returns counts of approved institutions, active students, and active employees
 */
export async function getAdminDashboardStats(): Promise<InstitutionDashboardStats> {
  const result = await runQuery<{
    totalInstitutions: number;
    totalStudents: number;
    totalEmployees: number;
    totalClubs: number;
    approvedInstitutions: number;
    pendingInstitutions: number;
  }>(
    `
    // Count institutions with approved and pending status
    MATCH (i:User {platformRole: "institution"})
    WITH 
      COUNT(CASE WHEN coalesce(i.status, "") = "approved" THEN 1 END) AS approvedInstitutions,
      COUNT(CASE WHEN coalesce(i.status, "pending") = "pending" THEN 1 END) AS pendingInstitutions
    
    // Count active students - users where platformRole is NULL or "student" AND status is "active"
    MATCH (s:User)
    WHERE (s.platformRole IS NULL OR s.platformRole = "student")
      AND coalesce(s.status, "active") = "active"
    WITH approvedInstitutions, pendingInstitutions, COUNT(DISTINCT s) AS totalStudents
    
    // Count active employees - users with platformRole "employee" AND status "active"
    MATCH (e:User {platformRole: "employee"})
    WHERE coalesce(e.status, "active") = "active"
    WITH approvedInstitutions, pendingInstitutions, totalStudents, COUNT(DISTINCT e) AS totalEmployees
    
    // Count clubs (keeping for interface compatibility, can be 0 if not needed)
    MATCH (c:Club)
    WITH approvedInstitutions, pendingInstitutions, totalStudents, totalEmployees, COUNT(DISTINCT c) AS totalClubs
    
    RETURN approvedInstitutions, pendingInstitutions, approvedInstitutions AS totalInstitutions, totalStudents, totalEmployees, totalClubs
    `
  );

  const stats = result[0];
  return {
    totalInstitutions: stats?.approvedInstitutions || 0,
    totalStudents: stats?.totalStudents || 0,
    totalEmployees: stats?.totalEmployees || 0,
    totalClubs: stats?.totalClubs || 0,
    // Additional fields for Platform Summary
    approvedInstitutions: stats?.approvedInstitutions || 0,
    pendingInstitutions: stats?.pendingInstitutions || 0,
  };
}

/**
 * Get institution statistics for admin dashboard
 * Returns counts of registered, pending, and rejected institutions
 */
export async function getAdminInstitutionStats(): Promise<InstitutionStats> {
  const result = await runQuery<{
    registered: number;
    pending: number;
    rejected: number;
  }>(
    `
    MATCH (i:User {platformRole: "institution"})
    WITH 
      COUNT(CASE WHEN coalesce(i.status, "") IN ["active", "approved"] THEN 1 END) AS registered,
      COUNT(CASE WHEN i.status IS NULL OR i.status = "pending" THEN 1 END) AS pending,
      COUNT(CASE WHEN i.status = "rejected" THEN 1 END) AS rejected
    RETURN registered, pending, rejected
    `
  );

  const stats = result[0];
  return {
    registered: stats?.registered || 0,
    pending: stats?.pending || 0,
    rejected: stats?.rejected || 0,
  };
}

/**
 * Get list of institutions for admin approval table
 * Filters by status (pending by default) and search query
 */
export async function getAdminInstitutionList(
  status?: string,
  searchQuery?: string
): Promise<InstitutionListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {};

  if (status && status !== "all") {
    if (status === "approved") {
      // Include both "approved" and "active" statuses
      filters.push(`(i.status = "approved" OR i.status = "active")`);
    } else {
      filters.push(`coalesce(i.status, "pending") = $status`);
      params.status = status;
    }
  } else {
    // When status is "all" or not provided, show all statuses (approved, pending, rejected)
    // Filter to only show these three statuses
    filters.push(
      `coalesce(i.status, "pending") IN ["approved", "active", "pending", "rejected"]`
    );
  }

  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(i.name) CONTAINS $searchQuery OR toLower(i.contactPersonEmail) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await runQuery<{
    id: string;
    logo?: string;
    name: string;
    contactPersonEmail: string;
    status: string;
    createdAt: string;
  }>(
    `
    MATCH (i:User {platformRole: "institution"})
    ${where}
    RETURN 
      coalesce(i.userId, i.institutionId) AS id,
      i.avatarUrl AS logo,
      coalesce(i.name, i.institutionName, "") AS name,
      coalesce(i.contactPersonEmail, "") AS contactPersonEmail,
      coalesce(i.status, "pending") AS status,
      coalesce(i.createdAt, "") AS createdAt
    ORDER BY i.createdAt DESC
    `,
    params
  );

  return result;
}
