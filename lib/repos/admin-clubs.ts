import { runQuery } from "@/lib/neo4j";

export interface AdminClubStats {
  approvedClubs: number;
  pendingClubs: number;
  suspendedClubs: number;
}

export interface AdminClubListItem {
  clubId: string;
  logo?: string;
  clubName: string;
  clubAcr?: string;
  about?: string;
  status: string;
  institutionId: string;
  institutionName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get club statistics for admin dashboard
 * Returns counts of approved, pending, and suspended clubs
 */
export async function getAdminClubStats(): Promise<AdminClubStats> {
  const result = await runQuery<{
    approvedClubs: number;
    pendingClubs: number;
    suspendedClubs: number;
  }>(
    `
    MATCH (c:Club)
    WITH 
      COUNT(CASE WHEN coalesce(c.status, "pending") = "approved" THEN 1 END) AS approvedClubs,
      COUNT(CASE WHEN coalesce(c.status, "pending") = "pending" THEN 1 END) AS pendingClubs,
      COUNT(CASE WHEN coalesce(c.status, "pending") = "suspended" THEN 1 END) AS suspendedClubs
    RETURN approvedClubs, pendingClubs, suspendedClubs
    `
  );

  const stats = result[0];
  return {
    approvedClubs: stats?.approvedClubs || 0,
    pendingClubs: stats?.pendingClubs || 0,
    suspendedClubs: stats?.suspendedClubs || 0,
  };
}

/**
 * Get list of clubs for admin table
 * Filters by status (approved, pending, suspended), search query, and institution
 */
export async function getAdminClubList(
  status?: string,
  searchQuery?: string,
  institutionId?: string
): Promise<AdminClubListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {};

  if (status && status !== "all") {
    filters.push(`coalesce(c.status, "pending") = $status`);
    params.status = status;
  } else {
    // Show all statuses: approved, pending, suspended
    filters.push(
      `coalesce(c.status, "pending") IN ["approved", "pending", "suspended"]`
    );
  }

  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(coalesce(c.name, c.clubName, "")) CONTAINS $searchQuery OR toLower(coalesce(c.acronym, c.clubAcr, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  // Build WHERE clause for club filters
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  // Add institution filter parameter if needed
  const institutionFilter =
    institutionId && institutionId !== "all"
      ? `AND (i.userId = $institutionId OR i.institutionId = $institutionId)`
      : "";

  if (institutionId && institutionId !== "all") {
    params.institutionId = institutionId;
  }

  const result = await runQuery<{
    clubId: string;
    logo?: string;
    clubName: string;
    clubAcr?: string;
    about?: string;
    status: string;
    institutionId: string;
    institutionName: string;
    createdAt: string;
    updatedAt: string;
  }>(
    `
    MATCH (c:Club)
    ${where}
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(i)
    WHERE (i IS NULL OR i:Institution OR i.platformRole = "institution")
    ${institutionFilter}
    RETURN 
      coalesce(c.clubId, "") AS clubId,
      c.logo AS logo,
      coalesce(c.name, c.clubName, "") AS clubName,
      coalesce(c.acronym, c.clubAcr) AS clubAcr,
      c.about AS about,
      coalesce(c.status, "pending") AS status,
      coalesce(i.userId, i.institutionId, "") AS institutionId,
      coalesce(i.name, i.institutionName, "No Institution") AS institutionName,
      coalesce(c.createdAt, c.created_at, "") AS createdAt,
      coalesce(c.updatedAt, c.updated_at, "") AS updatedAt
    ORDER BY c.createdAt DESC, c.created_at DESC
    `,
    params
  );

  return result;
}

/**
 * Get list of approved institutions for dropdown
 */
export async function getApprovedInstitutionOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  const result = await runQuery<{
    id: string;
    name: string;
  }>(
    `
    MATCH (i:User {platformRole: "institution"})
    WHERE coalesce(i.status, "") = "approved"
    RETURN 
      coalesce(i.userId, i.institutionId) AS id,
      coalesce(i.name, i.institutionName, "") AS name
    ORDER BY i.name ASC
    `
  );

  return result;
}
