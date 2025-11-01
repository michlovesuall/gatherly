import { runQuery } from "@/lib/neo4j";

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  institutionName: string;
  institutionId: string;
  platformRole: string;
  status: string;
}

/**
 * Get user statistics for admin dashboard
 * Returns counts of total, active, and disabled users
 */
export async function getAdminUserStats(): Promise<AdminUserStats> {
  const result = await runQuery<{
    totalUsers: number;
    activeUsers: number;
    disabledUsers: number;
  }>(
    `
    MATCH (u:User)
    WHERE u.platformRole IS NULL 
       OR u.platformRole IN ["student", "employee"]
    WITH 
      COUNT(u) AS totalUsers,
      COUNT(CASE WHEN coalesce(u.status, "active") = "active" THEN 1 END) AS activeUsers,
      COUNT(CASE WHEN coalesce(u.status, "") = "disabled" THEN 1 END) AS disabledUsers
    RETURN totalUsers, activeUsers, disabledUsers
    `
  );

  const stats = result[0];
  return {
    totalUsers: stats?.totalUsers || 0,
    activeUsers: stats?.activeUsers || 0,
    disabledUsers: stats?.disabledUsers || 0,
  };
}

/**
 * Get list of users for admin table
 * Filters by platformRole (student/employee), status (active/disabled), institution, and search query
 */
export async function getAdminUserList(
  platformRole?: string,
  status?: string,
  institutionId?: string,
  searchQuery?: string
): Promise<AdminUserListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {};

  // Filter by role - only show students and employees
  filters.push(
    `(u.platformRole IS NULL OR u.platformRole IN ["student", "employee"])`
  );

  if (platformRole && platformRole !== "all") {
    if (platformRole === "student") {
      filters.push(
        `(u.platformRole IS NULL OR coalesce(toLower(u.platformRole), "student") = "student")`
      );
    } else if (platformRole === "employee") {
      filters.push(`u.platformRole = "employee"`);
    }
  }

  if (status && status !== "all") {
    if (status === "active") {
      // Only match users with exactly "active" status (no null or other values)
      filters.push(`u.status = $status`);
      params.status = "active";
    } else if (status === "disabled") {
      // Only match users with exactly "disabled" status
      filters.push(`u.status = $status`);
      params.status = "disabled";
    }
  }

  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(u.name) CONTAINS $searchQuery OR toLower(u.email) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  // Build WHERE clause for user-level filters
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  // Add institution filter parameter if needed
  if (institutionId && institutionId !== "all") {
    params.institutionId = institutionId;
  }

  // Use different query structure based on whether institution filter is applied
  let query: string;
  if (institutionId && institutionId !== "all") {
    // When filtering by institution, require the MEMBER_OF relationship
    // Apply user filters first, then match institution with filter
    query = `
    MATCH (u:User)
    ${where}
    MATCH (u)-[:MEMBER_OF]->(i)
    WHERE (i:Institution OR i.platformRole = "institution")
      AND (i.userId = $institutionId OR i.institutionId = $institutionId)
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      coalesce(i.name, i.institutionName, "No Institution") AS institutionName,
      coalesce(i.userId, i.institutionId, "") AS institutionId,
      coalesce(toLower(u.platformRole), "student") AS platformRole,
      coalesce(u.status, "active") AS status
    ORDER BY u.name ASC
    `;
  } else {
    // When not filtering by institution, use OPTIONAL MATCH
    // Apply user filters first, then optionally match institution
    query = `
    MATCH (u:User)
    ${where}
    OPTIONAL MATCH (u)-[:MEMBER_OF]->(i)
    WHERE i IS NULL OR i:Institution OR i.platformRole = "institution"
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      coalesce(i.name, i.institutionName, "No Institution") AS institutionName,
      coalesce(i.userId, i.institutionId, "") AS institutionId,
      coalesce(toLower(u.platformRole), "student") AS platformRole,
      coalesce(u.status, "active") AS status
    ORDER BY u.name ASC
    `;
  }

  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    institutionName: string;
    institutionId: string;
    platformRole: string;
    status: string;
  }>(query, params);

  return result;
}

/**
 * Get list of institutions for filter dropdown
 */
export async function getInstitutionOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  const result = await runQuery<{
    id: string;
    name: string;
  }>(
    `
    MATCH (i:User {platformRole: "institution"})
    WHERE coalesce(i.status, "") IN ["active", "approved"]
    RETURN 
      coalesce(i.userId, i.institutionId) AS id,
      coalesce(i.name, i.institutionName, "") AS name
    ORDER BY i.name ASC
    `
  );

  return result;
}
