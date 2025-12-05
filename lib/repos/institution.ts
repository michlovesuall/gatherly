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
 * Get institution-specific dashboard statistics
 * Returns counts of employees, students, and clubs for a specific institution
 */
export async function getInstitutionSpecificStats(
  institutionId: string
): Promise<{
  totalStudents: number;
  totalEmployees: number;
  totalClubs: number;
}> {
  const result = await runQuery<{
    totalStudents: number;
    totalEmployees: number;
    totalClubs: number;
  }>(
    `
    // Match the institution first
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Count students - users with platformRole "student" or NULL that are MEMBER_OF this institution
    OPTIONAL MATCH (s:User)-[:MEMBER_OF]->(i)
    WHERE (s.platformRole IS NULL OR s.platformRole = "student")
      AND coalesce(s.status, "active") = "active"
    WITH i, COUNT(DISTINCT s) AS totalStudents
    
    // Count employees - users with platformRole "employee" that are MEMBER_OF this institution
    OPTIONAL MATCH (e:User)-[:MEMBER_OF]->(i)
    WHERE e.platformRole = "employee"
      AND coalesce(e.status, "active") = "active"
    WITH i, totalStudents, COUNT(DISTINCT e) AS totalEmployees
    
    // Count clubs - clubs that BELONGS_TO this institution
    OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
    WITH totalStudents, totalEmployees, COUNT(DISTINCT c) AS totalClubs
    
    RETURN totalStudents, totalEmployees, totalClubs
    `,
    { institutionId }
  );

  const stats = result[0];
  return {
    totalStudents: stats?.totalStudents || 0,
    totalEmployees: stats?.totalEmployees || 0,
    totalClubs: stats?.totalClubs || 0,
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
      filters.push(`(i.status = 'approved' OR i.status = 'active')`);
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

export interface InstitutionUserListItem {
  id: string;
  name: string;
  email: string;
  idNumber?: string;
  phone?: string;
  platformRole: string;
  status: string;
  memberStatus: string;
  createdAt: string;
}

export interface InstitutionUserStats {
  totalUsers: number;
  totalStudents: number;
  totalEmployees: number;
}

/**
 * Get user statistics for institution dashboard
 * Returns counts of total users, students, and employees within the institution
 */
export async function getInstitutionUserStats(
  institutionId: string
): Promise<InstitutionUserStats> {
  const result = await runQuery<{
    totalUsers: number;
    totalStudents: number;
    totalEmployees: number;
  }>(
    `
    // Match the institution
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Count all users (students + employees) that are MEMBER_OF this institution
    OPTIONAL MATCH (u:User)-[m:MEMBER_OF]->(i)
    WHERE (u.platformRole IS NULL OR u.platformRole IN ["student", "employee"])
    WITH i, COUNT(DISTINCT u) AS totalUsers
    
    // Count students
    OPTIONAL MATCH (s:User)-[ms:MEMBER_OF]->(i)
    WHERE (s.platformRole IS NULL OR s.platformRole = "student")
    WITH i, totalUsers, COUNT(DISTINCT s) AS totalStudents
    
    // Count employees
    OPTIONAL MATCH (e:User)-[me:MEMBER_OF]->(i)
    WHERE e.platformRole = "employee"
    WITH totalUsers, totalStudents, COUNT(DISTINCT e) AS totalEmployees
    
    RETURN totalUsers, totalStudents, totalEmployees
    `,
    { institutionId }
  );

  const stats = result[0];
  return {
    totalUsers: stats?.totalUsers || 0,
    totalStudents: stats?.totalStudents || 0,
    totalEmployees: stats?.totalEmployees || 0,
  };
}

/**
 * Get list of pending users for institution approval
 * Filters by name and user type (student/employee)
 */
export async function getInstitutionPendingUsers(
  institutionId: string,
  searchQuery?: string,
  userType?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{
  users: InstitutionUserListItem[];
  total: number;
}> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by member status (pending)
  filters.push(`coalesce(m.status, 'pending') = 'pending'`);

  // Filter by user type
  if (userType && userType !== "all") {
    if (userType === "student") {
      filters.push(`(u.platformRole IS NULL OR u.platformRole = 'student')`);
    } else if (userType === "employee") {
      filters.push(`u.platformRole = 'employee'`);
    }
  } else {
    // Include both students and employees
    filters.push(
      `(u.platformRole IS NULL OR u.platformRole IN ['student', 'employee'])`
    );
  }

  // Filter by search query (name or email)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(u.name) CONTAINS $searchQuery OR toLower(u.email) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";

  // Get total count
  const countResult = await runQuery<{ count: number }>(
    `
    MATCH (u:User)-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    RETURN COUNT(DISTINCT u) AS count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get paginated users
  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    idNumber?: string;
    phone?: string;
    platformRole: string;
    status: string;
    memberStatus: string;
    createdAt: string;
  }>(
    `
    MATCH (u:User)-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      u.idNumber AS idNumber,
      u.phone AS phone,
      coalesce(toLower(u.platformRole), "student") AS platformRole,
      coalesce(u.status, "active") AS status,
      coalesce(m.status, "pending") AS memberStatus,
      coalesce(u.createdAt, "") AS createdAt
    ORDER BY u.createdAt DESC
    SKIP $skip
    LIMIT $limit
    `,
    params
  );

  return {
    users: result,
    total,
  };
}

/**
 * Get list of approved users for institution
 * Filters by name and user type (student/employee)
 */
export async function getInstitutionApprovedUsers(
  institutionId: string,
  searchQuery?: string,
  userType?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{
  users: InstitutionUserListItem[];
  total: number;
}> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by member status (approved)
  filters.push(`coalesce(m.status, 'pending') = 'approved'`);

  // Filter by user type
  if (userType && userType !== "all") {
    if (userType === "student") {
      filters.push(`(u.platformRole IS NULL OR u.platformRole = 'student')`);
    } else if (userType === "employee") {
      filters.push(`u.platformRole = 'employee'`);
    }
  } else {
    // Include both students and employees
    filters.push(
      `(u.platformRole IS NULL OR u.platformRole IN ['student', 'employee'])`
    );
  }

  // Filter by search query (name or email)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(u.name) CONTAINS $searchQuery OR toLower(u.email) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";

  // Get total count
  const countResult = await runQuery<{ count: number }>(
    `
    MATCH (u:User)-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    RETURN COUNT(DISTINCT u) AS count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get paginated users
  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    idNumber?: string;
    phone?: string;
    platformRole: string;
    status: string;
    memberStatus: string;
    createdAt: string;
  }>(
    `
    MATCH (u:User)-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      u.idNumber AS idNumber,
      u.phone AS phone,
      coalesce(toLower(u.platformRole), "student") AS platformRole,
      coalesce(u.status, "active") AS status,
      coalesce(m.status, "pending") AS memberStatus,
      coalesce(u.createdAt, "") AS createdAt
    ORDER BY u.name ASC
    SKIP $skip
    LIMIT $limit
    `,
    params
  );

  return {
    users: result,
    total,
  };
}

/**
 * Get user details by ID for institution
 */
export async function getInstitutionUserDetails(
  userId: string,
  institutionId: string
): Promise<InstitutionUserListItem | null> {
  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    idNumber?: string;
    phone?: string;
    platformRole: string;
    status: string;
    memberStatus: string;
    createdAt: string;
  }>(
    `
    MATCH (u:User {userId: $userId})-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      u.idNumber AS idNumber,
      u.phone AS phone,
      coalesce(toLower(u.platformRole), "student") AS platformRole,
      coalesce(u.status, "active") AS status,
      coalesce(m.status, "pending") AS memberStatus,
      coalesce(u.createdAt, "") AS createdAt
    LIMIT 1
    `,
    { userId, institutionId }
  );

  if (!result.length) {
    return null;
  }

  return result[0];
}

export interface InstitutionAdvisorStats {
  totalEmployees: number;
  totalAdvisors: number;
}

/**
 * Get advisor statistics for institution
 * Returns counts of total employees and employees assigned as advisors
 */
export async function getInstitutionAdvisorStats(
  institutionId: string
): Promise<InstitutionAdvisorStats> {
  const result = await runQuery<{
    totalEmployees: number;
    totalAdvisors: number;
  }>(
    `
    // Match the institution
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Count all employees that are MEMBER_OF this institution
    OPTIONAL MATCH (e:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE coalesce(m.status, "pending") = "approved"
    WITH i, COUNT(DISTINCT e) AS totalEmployees
    
    // Count employees that are assigned as advisors (have ADVISES relationship to clubs in this institution)
    // Match employees that are members of the institution AND have ADVISES relationship to clubs
    OPTIONAL MATCH (a:User {platformRole: "employee"})-[m2:MEMBER_OF]->(i)
    WHERE coalesce(m2.status, "pending") = "approved"
      AND EXISTS {
        MATCH (a)-[:ADVISES]->(c:Club)-[:BELONGS_TO]->(i)
      }
    WITH totalEmployees, COUNT(DISTINCT a) AS totalAdvisors
    
    RETURN totalEmployees, totalAdvisors
    `,
    { institutionId }
  );

  const stats = result[0];
  return {
    totalEmployees: stats?.totalEmployees || 0,
    totalAdvisors: stats?.totalAdvisors || 0,
  };
}

export interface InstitutionStaffStats {
  totalEmployees: number;
  totalStaffs: number;
}

export interface InstitutionEmployeeListItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  platformRole: string;
  status: string;
  isStaff: boolean;
}

/**
 * Get staff statistics for institution
 * Returns counts of total employees and employees assigned as staff
 */
export async function getInstitutionStaffStats(
  institutionId: string
): Promise<InstitutionStaffStats> {
  const result = await runQuery<{
    totalEmployees: number;
    totalStaffs: number;
  }>(
    `
    // Match the institution
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Count all employees that are MEMBER_OF this institution
    OPTIONAL MATCH (e:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE coalesce(m.status, "pending") = "approved"
    WITH i, COUNT(DISTINCT e) AS totalEmployees
    
    // Count employees that are assigned as staff (have IS_STAFF_OF relationship)
    OPTIONAL MATCH (s:User {platformRole: "employee"})-[m2:MEMBER_OF]->(i)
    WHERE coalesce(m2.status, "pending") = "approved"
      AND EXISTS { (s)-[:IS_STAFF_OF]->(i) }
    WITH totalEmployees, COUNT(DISTINCT s) AS totalStaffs
    
    RETURN totalEmployees, totalStaffs
    `,
    { institutionId }
  );

  const stats = result[0];
  return {
    totalEmployees: stats?.totalEmployees || 0,
    totalStaffs: stats?.totalStaffs || 0,
  };
}

/**
 * Get list of approved employees for institution (excluding staff)
 * Filters by name, email, phone
 */
export async function getInstitutionApprovedEmployees(
  institutionId: string,
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: "name" | "email" = "name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<{
  employees: InstitutionEmployeeListItem[];
  total: number;
}> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by member status (approved) and exclude staff
  filters.push(`coalesce(m.status, 'pending') = 'approved'`);
  // Exclude staff - check that there's no IS_STAFF_OF relationship

  // Filter by search query (name, email, or phone)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(u.name) CONTAINS $searchQuery OR toLower(u.email) CONTAINS $searchQuery OR toLower(coalesce(u.phone, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";
  const orderBy = sortOrder === "asc" ? "ASC" : "DESC";
  const sortField = sortBy === "name" ? "u.name" : "u.email";

  // Get total count
  const countResult = await runQuery<{ count: number }>(
    `
    MATCH (u:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
      AND NOT EXISTS { (u)-[:IS_STAFF_OF]->(i) }
    RETURN COUNT(DISTINCT u) AS count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get paginated employees
  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    platformRole: string;
    status: string;
    isStaff: boolean;
  }>(
    `
    MATCH (u:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
      AND NOT EXISTS { (u)-[:IS_STAFF_OF]->(i) }
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      u.phone AS phone,
      u.avatarUrl AS avatarUrl,
      coalesce(toLower(u.platformRole), "employee") AS platformRole,
      coalesce(u.status, "active") AS status,
      false AS isStaff
    ORDER BY ${sortField} ${orderBy}
    SKIP $skip
    LIMIT $limit
    `,
    params
  );

  return {
    employees: result,
    total,
  };
}

/**
 * Get list of assigned staffs for institution
 * Filters by name, email, phone
 */
export async function getInstitutionStaffs(
  institutionId: string,
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: "name" | "email" = "name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<{
  staffs: InstitutionEmployeeListItem[];
  total: number;
}> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by member status (approved) and has IS_STAFF_OF relationship
  filters.push(`coalesce(m.status, 'pending') = 'approved'`);

  // Filter by search query (name, email, or phone)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(u.name) CONTAINS $searchQuery OR toLower(u.email) CONTAINS $searchQuery OR toLower(coalesce(u.phone, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";
  const orderBy = sortOrder === "asc" ? "ASC" : "DESC";
  const sortField = sortBy === "name" ? "u.name" : "u.email";

  // Get total count
  const countResult = await runQuery<{ count: number }>(
    `
    MATCH (u:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    RETURN COUNT(DISTINCT u) AS count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get paginated staffs
  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    platformRole: string;
    status: string;
    isStaff: boolean;
  }>(
    `
    MATCH (u:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
      AND EXISTS { (u)-[:IS_STAFF_OF]->(i) }
    RETURN 
      u.userId AS id,
      coalesce(u.name, "") AS name,
      coalesce(u.email, "") AS email,
      u.phone AS phone,
      u.avatarUrl AS avatarUrl,
      coalesce(toLower(u.platformRole), "employee") AS platformRole,
      coalesce(u.status, "active") AS status,
      true AS isStaff
    ORDER BY ${sortField} ${orderBy}
    SKIP $skip
    LIMIT $limit
    `,
    params
  );

  return {
    staffs: result,
    total,
  };
}

export interface InstitutionClubListItem {
  clubId: string;
  logo?: string;
  acronym?: string;
  clubName: string;
  email?: string;
  phone?: string;
  hasAdvisor: boolean;
  advisorName?: string;
}

/**
 * Get list of approved clubs for institution with advisor status
 * Filters by acronym, club name, email, and advisor status
 */
export async function getInstitutionApprovedClubs(
  institutionId: string,
  searchQuery?: string,
  advisorStatus?: string
): Promise<InstitutionClubListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
  };

  // Filter by club status (approved)
  filters.push(`coalesce(c.status, 'pending') = 'approved'`);

  // Note: Advisor status filtering is done after collecting advisors in the query

  // Filter by search query (acronym, club name, or email)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(coalesce(c.acronym, c.clubAcr, "")) CONTAINS $searchQuery OR toLower(coalesce(c.name, c.clubName, "")) CONTAINS $searchQuery OR toLower(coalesce(c.email, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";

  const result = await runQuery<{
    clubId: string;
    logo?: string;
    acronym?: string;
    clubName: string;
    email?: string;
    phone?: string;
    hasAdvisor: boolean;
    advisorName?: string;
  }>(
    `
    MATCH (c:Club)-[:BELONGS_TO]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    OPTIONAL MATCH (c)<-[:ADVISES]-(a:User)
    WITH c, collect(DISTINCT a) AS allAdvisors
    WITH c, [advisor IN allAdvisors WHERE advisor IS NOT NULL] AS advisors
    WITH c, advisors, CASE WHEN size(advisors) > 0 THEN advisors[0] ELSE null END AS firstAdvisor
    WHERE 
      CASE 
        WHEN $advisorStatus = "has_advisor" THEN size(advisors) > 0
        WHEN $advisorStatus = "no_advisor" THEN size(advisors) = 0
        ELSE true
      END
    RETURN 
      c.clubId AS clubId,
      c.logo AS logo,
      coalesce(c.acronym, c.clubAcr) AS acronym,
      coalesce(c.name, c.clubName, "") AS clubName,
      c.email AS email,
      c.phone AS phone,
      CASE WHEN firstAdvisor IS NOT NULL THEN true ELSE false END AS hasAdvisor,
      firstAdvisor.name AS advisorName
    ORDER BY c.name ASC, c.clubName ASC
    `,
    { ...params, advisorStatus: advisorStatus || "all" }
  );

  return result;
}

/**
 * Get list of approved employees who are not advisors for a specific club
 * Filters by name, email, phone
 */
export async function getInstitutionEmployeesForClubAdvisor(
  institutionId: string,
  clubId: string,
  searchQuery?: string
): Promise<InstitutionEmployeeListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    clubId,
  };

  // Filter by member status (approved)
  filters.push(`coalesce(m.status, 'pending') = 'approved'`);

  // Filter by search query (name, email, or phone)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(e.name) CONTAINS $searchQuery OR toLower(e.email) CONTAINS $searchQuery OR toLower(coalesce(e.phone, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";

  const result = await runQuery<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    platformRole: string;
    status: string;
    isStaff: boolean;
  }>(
    `
    MATCH (e:User {platformRole: "employee"})-[m:MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
      AND NOT EXISTS {
        MATCH (e)-[:ADVISES]->(c:Club {clubId: $clubId})
      }
    RETURN 
      e.userId AS id,
      coalesce(e.name, "") AS name,
      coalesce(e.email, "") AS email,
      e.phone AS phone,
      e.avatarUrl AS avatarUrl,
      coalesce(toLower(e.platformRole), "employee") AS platformRole,
      coalesce(e.status, "active") AS status,
      CASE WHEN EXISTS { (e)-[:IS_STAFF_OF]->(i) } THEN true ELSE false END AS isStaff
    ORDER BY e.name ASC
    `,
    params
  );

  return result;
}

/**
 * Get list of pending clubs for institution approval
 * Filters by acronym, club name, email
 */
export async function getInstitutionPendingClubs(
  institutionId: string,
  searchQuery?: string
): Promise<InstitutionClubListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
  };

  // Filter by club status (pending)
  filters.push(`coalesce(c.status, 'pending') = 'pending'`);

  // Filter by search query (acronym, club name, or email)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(coalesce(c.acronym, c.clubAcr, "")) CONTAINS $searchQuery OR toLower(coalesce(c.name, c.clubName, "")) CONTAINS $searchQuery OR toLower(coalesce(c.email, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";

  const result = await runQuery<{
    clubId: string;
    logo?: string;
    acronym?: string;
    clubName: string;
    email?: string;
    phone?: string;
    hasAdvisor: boolean;
    advisorName?: string;
  }>(
    `
    MATCH (c:Club)-[:BELONGS_TO]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      ${additionalFilters}
    OPTIONAL MATCH (c)<-[:ADVISES]-(a:User)
    RETURN 
      c.clubId AS clubId,
      c.logo AS logo,
      coalesce(c.acronym, c.clubAcr) AS acronym,
      coalesce(c.name, c.clubName, "") AS clubName,
      c.email AS email,
      c.phone AS phone,
      CASE WHEN a IS NOT NULL THEN true ELSE false END AS hasAdvisor,
      a.name AS advisorName
    ORDER BY c.name ASC, c.clubName ASC
    `,
    params
  );

  return result;
}

// ==================== COLLEGES & DEPARTMENTS ====================

export interface CollegeListItem {
  collegeId: string;
  logo?: string;
  name: string;
  acronym: string;
  email: string;
  phone?: string;
}

export interface DepartmentListItem {
  departmentId: string;
  logo?: string;
  name: string;
  acronym: string;
  email: string;
  phone?: string;
  collegeId: string;
  collegeName: string;
}

export interface InstitutionSettingsStats {
  totalColleges: number;
  totalDepartments: number;
  totalPrograms: number;
}

/**
 * Get institution settings statistics
 */
export async function getInstitutionSettingsStats(
  institutionId: string
): Promise<InstitutionSettingsStats> {
  const result = await runQuery<{
    totalColleges: number;
    totalDepartments: number;
    totalPrograms: number;
  }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    OPTIONAL MATCH (c:College)-[:BELONGS_TO]->(i)
    WITH i, COUNT(DISTINCT c) AS totalColleges
    
    OPTIONAL MATCH (d:Department)-[:BELONGS_TO]->(i)
    WITH i, totalColleges, COUNT(DISTINCT d) AS totalDepartments
    
    OPTIONAL MATCH (p:Program)-[:BELONGS_TO]->(i)
    WITH totalColleges, totalDepartments, COUNT(DISTINCT p) AS totalPrograms
    
    RETURN totalColleges, totalDepartments, totalPrograms
    `,
    { institutionId }
  );

  const stats = result[0];
  return {
    totalColleges: stats?.totalColleges || 0,
    totalDepartments: stats?.totalDepartments || 0,
    totalPrograms: stats?.totalPrograms || 0,
  };
}

/**
 * Get list of colleges for an institution
 */
export async function getInstitutionColleges(
  institutionId: string,
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: "name" = "name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<{ colleges: CollegeListItem[]; total: number }> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by search query (name, acronym, or email)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(coalesce(c.name, "")) CONTAINS $searchQuery OR toLower(coalesce(c.acronym, "")) CONTAINS $searchQuery OR toLower(coalesce(c.email, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";
  const orderBy = sortOrder === "asc" ? "ASC" : "DESC";
  const sortField = sortBy === "name" ? "c.name" : "c.name";

  const [dataResult, countResult] = await Promise.all([
    runQuery<CollegeListItem>(
      `
      MATCH (c:College)-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        ${additionalFilters}
      RETURN 
        c.collegeId AS collegeId,
        c.logo AS logo,
        coalesce(c.name, "") AS name,
        coalesce(c.acronym, "") AS acronym,
        coalesce(c.email, "") AS email,
        c.phone AS phone
      ORDER BY ${sortField} ${orderBy}
      SKIP $skip
      LIMIT $limit
      `,
      params
    ),
    runQuery<{ count: number }>(
      `
      MATCH (c:College)-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        ${additionalFilters}
      RETURN COUNT(c) AS count
      `,
      params
    ),
  ]);

  return {
    colleges: dataResult,
    total: countResult[0]?.count || 0,
  };
}

/**
 * Get list of departments for an institution
 */
export async function getInstitutionDepartments(
  institutionId: string,
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: "name" = "name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<{ departments: DepartmentListItem[]; total: number }> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by search query (name, acronym, or email)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(coalesce(d.name, "")) CONTAINS $searchQuery OR toLower(coalesce(d.acronym, "")) CONTAINS $searchQuery OR toLower(coalesce(d.email, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";
  const orderBy = sortOrder === "asc" ? "ASC" : "DESC";
  const sortField = sortBy === "name" ? "d.name" : "d.name";

  const [dataResult, countResult] = await Promise.all([
    runQuery<DepartmentListItem>(
      `
      MATCH (d:Department)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (d)-[:BELONGS_TO_COLLEGE]->(c:College)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        ${additionalFilters}
      RETURN 
        d.departmentId AS departmentId,
        d.logo AS logo,
        coalesce(d.name, "") AS name,
        coalesce(d.acronym, "") AS acronym,
        coalesce(d.email, "") AS email,
        d.phone AS phone,
        coalesce(c.collegeId, "") AS collegeId,
        coalesce(c.name, "") AS collegeName
      ORDER BY ${sortField} ${orderBy}
      SKIP $skip
      LIMIT $limit
      `,
      params
    ),
    runQuery<{ count: number }>(
      `
      MATCH (d:Department)-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        ${additionalFilters}
      RETURN COUNT(d) AS count
      `,
      params
    ),
  ]);

  return {
    departments: dataResult,
    total: countResult[0]?.count || 0,
  };
}

/**
 * Get all colleges for dropdown selection
 */
export async function getAllInstitutionColleges(
  institutionId: string
): Promise<Array<{ collegeId: string; name: string; acronym: string }>> {
  const result = await runQuery<{
    collegeId: string;
    name: string;
    acronym: string;
  }>(
    `
    MATCH (c:College)-[:BELONGS_TO]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN 
      c.collegeId AS collegeId,
      coalesce(c.name, "") AS name,
      coalesce(c.acronym, "") AS acronym
    ORDER BY c.name ASC
    `,
    { institutionId }
  );

  return result;
}

export interface ProgramListItem {
  programId: string;
  name: string;
  acronym: string;
  collegeId: string;
  collegeName: string;
  departmentId: string;
  departmentName: string;
}

/**
 * Get list of programs for an institution
 */
export async function getInstitutionPrograms(
  institutionId: string,
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: "name" = "name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<{ programs: ProgramListItem[]; total: number }> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Filter by search query (name or acronym)
  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(coalesce(p.name, "")) CONTAINS $searchQuery OR toLower(coalesce(p.acronym, "")) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";
  const orderBy = sortOrder === "asc" ? "ASC" : "DESC";
  const sortField = sortBy === "name" ? "p.name" : "p.name";

  const [dataResult, countResult] = await Promise.all([
    runQuery<ProgramListItem>(
      `
      MATCH (p:Program)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (p)-[:BELONGS_TO_DEPARTMENT]->(d:Department)
      OPTIONAL MATCH (d)-[:BELONGS_TO_COLLEGE]->(c:College)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        ${additionalFilters}
      RETURN 
        p.programId AS programId,
        coalesce(p.name, "") AS name,
        coalesce(p.acronym, "") AS acronym,
        coalesce(c.collegeId, "") AS collegeId,
        coalesce(c.name, "") AS collegeName,
        coalesce(d.departmentId, "") AS departmentId,
        coalesce(d.name, "") AS departmentName
      ORDER BY ${sortField} ${orderBy}
      SKIP $skip
      LIMIT $limit
      `,
      params
    ),
    runQuery<{ count: number }>(
      `
      MATCH (p:Program)-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        ${additionalFilters}
      RETURN COUNT(p) AS count
      `,
      params
    ),
  ]);

  return {
    programs: dataResult,
    total: countResult[0]?.count || 0,
  };
}

/**
 * Get all departments for dropdown selection with college info
 */
export async function getAllInstitutionDepartments(
  institutionId: string
): Promise<
  Array<{
    departmentId: string;
    name: string;
    acronym: string;
    collegeId: string;
    collegeName: string;
  }>
> {
  const result = await runQuery<{
    departmentId: string;
    name: string;
    acronym: string;
    collegeId: string;
    collegeName: string;
  }>(
    `
    MATCH (d:Department)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (d)-[:BELONGS_TO_COLLEGE]->(c:College)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN 
      d.departmentId AS departmentId,
      coalesce(d.name, "") AS name,
      coalesce(d.acronym, "") AS acronym,
      coalesce(c.collegeId, "") AS collegeId,
      coalesce(c.name, "") AS collegeName
    ORDER BY d.name ASC
    `,
    { institutionId }
  );

  return result;
}

/**
 * Get all programs for dropdown selection
 */
export async function getAllInstitutionPrograms(institutionId: string): Promise<
  Array<{
    programId: string;
    name: string;
    acronym: string;
    departmentId: string;
    departmentName: string;
    collegeId: string;
    collegeName: string;
  }>
> {
  const result = await runQuery<{
    programId: string;
    name: string;
    acronym: string;
    departmentId: string;
    departmentName: string;
    collegeId: string;
    collegeName: string;
  }>(
    `
    MATCH (p:Program)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (p)-[:BELONGS_TO_DEPARTMENT]->(d:Department)
    OPTIONAL MATCH (d)-[:BELONGS_TO_COLLEGE]->(c:College)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN 
      p.programId AS programId,
      coalesce(p.name, "") AS name,
      coalesce(p.acronym, "") AS acronym,
      coalesce(d.departmentId, "") AS departmentId,
      coalesce(d.name, "") AS departmentName,
      coalesce(c.collegeId, "") AS collegeId,
      coalesce(c.name, "") AS collegeName
    ORDER BY p.name ASC
    `,
    { institutionId }
  );

  return result;
}

// ==================== EVENTS ====================

export interface InstitutionEventListItem {
  eventId: string;
  title: string;
  description: string;
  startAt: string;
  endAt?: string;
  venue?: string;
  link?: string;
  maxSlots?: number;
  visibility: "public" | "institution" | "restricted";
  status: "draft" | "pending" | "approved" | "published" | "rejected" | "hidden";
  imageUrl?: string;
  posterId: string;
  posterName: string;
  clubId?: string;
  clubName?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface InstitutionEventStats {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  draft: number;
}

export interface InstitutionEventDetails extends InstitutionEventListItem {
  goingCount: number;
  interestedCount: number;
  checkedInCount: number;
}

/**
 * Get all events for an institution with filters
 * Includes events directly from institution and from clubs
 */
export async function getInstitutionEvents(
  institutionId: string,
  filters?: {
    status?: string;
    search?: string;
    sortBy?: "createdAt" | "startAt" | "status";
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }
): Promise<{ events: InstitutionEventListItem[]; total: number }> {
  const {
    status = "all",
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 20,
  } = filters || {};

  const filtersList: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  // Status filter
  if (status && status !== "all") {
    if (status === "approved") {
      filtersList.push(`e.status IN ["approved", "published"]`);
    } else {
      filtersList.push(`e.status = $status`);
      params.status = status;
    }
  } else {
    // Exclude deleted/hidden events by default
    filtersList.push(`e.status <> "deleted"`);
  }

  // Search filter
  if (search && search.trim()) {
    filtersList.push(`toLower(e.title) CONTAINS $search`);
    params.search = search.trim().toLowerCase();
  }

  const whereClause =
    filtersList.length > 0 ? `WHERE ${filtersList.join(" AND ")}` : "";

  // Sort order
  const orderBy =
    sortBy === "startAt"
      ? `e.startAt ${sortOrder.toUpperCase()}`
      : sortBy === "status"
      ? `e.status ${sortOrder.toUpperCase()}`
      : `e.createdAt ${sortOrder.toUpperCase()}`;

  // Get total count
  const countResult = await runQuery<{ count: number }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    OPTIONAL MATCH (e:Event)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event)
    WITH i, collect(DISTINCT e) + collect(DISTINCT e2) AS allEvents
    UNWIND allEvents AS e
    WHERE e IS NOT NULL
    ${whereClause}
    RETURN COUNT(DISTINCT e) AS count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get events
  const result = await runQuery<{
    eventId: string;
    title: string;
    description: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    link?: string;
    maxSlots?: number;
    visibility: string;
    status: string;
    imageUrl?: string;
    posterId: string;
    posterName: string;
    clubId?: string;
    clubName?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Get events directly from institution
    OPTIONAL MATCH (e1:Event)-[:BELONGS_TO]->(i)
    
    // Get events from clubs
    OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event)
    
    // Combine both types
    WITH i, collect(DISTINCT e1) AS directEvents, collect(DISTINCT e2) AS clubEvents
    WITH i, directEvents + clubEvents AS allEvents
    UNWIND allEvents AS e
    WHERE e IS NOT NULL
    
    // Get club info if event is from a club
    OPTIONAL MATCH (c2:Club)-[:HOSTS]->(e)
    OPTIONAL MATCH (c2)-[:BELONGS_TO]->(i)
    
    // Get tags
    OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
    
    ${whereClause}
    
    WITH e, c2, collect(DISTINCT t.name) AS tagNames
    RETURN 
      e.eventId AS eventId,
      e.title AS title,
      e.description AS description,
      e.startAt AS startAt,
      e.endAt AS endAt,
      e.venue AS venue,
      e.link AS link,
      e.maxSlots AS maxSlots,
      coalesce(e.visibility, "public") AS visibility,
      coalesce(e.status, "pending") AS status,
      e.imageUrl AS imageUrl,
      e.posterId AS posterId,
      coalesce(e.posterName, "") AS posterName,
      c2.clubId AS clubId,
      coalesce(c2.name, c2.clubName, "") AS clubName,
      e.createdAt AS createdAt,
      e.updatedAt AS updatedAt,
      tagNames AS tags
    ORDER BY ${orderBy}
    SKIP $skip
    LIMIT $limit
    `,
    params
  );

  return {
    events: result.map((r) => ({
      eventId: r.eventId,
      title: r.title,
      description: r.description,
      startAt: r.startAt,
      endAt: r.endAt,
      venue: r.venue,
      link: r.link,
      maxSlots: r.maxSlots,
      visibility: r.visibility as "public" | "institution" | "restricted",
      status: r.status as
        | "draft"
        | "pending"
        | "approved"
        | "published"
        | "rejected"
        | "hidden",
      imageUrl: r.imageUrl,
      posterId: r.posterId,
      posterName: r.posterName,
      clubId: r.clubId,
      clubName: r.clubName,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: r.tags?.filter((t) => t) || [],
    })),
    total,
  };
}

/**
 * Get pending events for approvals
 */
export async function getInstitutionPendingEvents(
  institutionId: string,
  search?: string
): Promise<InstitutionEventListItem[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = {
    institutionId,
  };

  filters.push(`e IS NOT NULL`);
  filters.push(`e.status = 'pending'`);

  if (search && search.trim()) {
    filters.push(`toLower(e.title) CONTAINS $search`);
    params.search = search.trim().toLowerCase();
  }

  const whereClause = `WHERE ${filters.join(" AND ")}`;

  const result = await runQuery<{
    eventId: string;
    title: string;
    description: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    link?: string;
    maxSlots?: number;
    visibility: string;
    status: string;
    imageUrl?: string;
    posterId: string;
    posterName: string;
    clubId?: string;
    clubName?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, '') = 'institution' OR i:Institution)
    
    OPTIONAL MATCH (e1:Event)-[:BELONGS_TO]->(i)
    
    OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event)
    
    WITH i, collect(DISTINCT e1) AS directEvents, collect(DISTINCT e2) AS clubEvents
    WITH i, directEvents + clubEvents AS allEvents
    UNWIND allEvents AS e
    
    WITH e, i
    ${whereClause}
    
    OPTIONAL MATCH (c2:Club)-[:HOSTS]->(e)
    OPTIONAL MATCH (c2)-[:BELONGS_TO]->(i)
    
    OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
    
    WITH e, c2, collect(DISTINCT t.name) AS tagNames
    RETURN 
      e.eventId AS eventId,
      e.title AS title,
      e.description AS description,
      e.startAt AS startAt,
      e.endAt AS endAt,
      e.venue AS venue,
      e.link AS link,
      e.maxSlots AS maxSlots,
      coalesce(e.visibility, 'public') AS visibility,
      coalesce(e.status, 'pending') AS status,
      e.imageUrl AS imageUrl,
      e.posterId AS posterId,
      coalesce(e.posterName, '') AS posterName,
      c2.clubId AS clubId,
      coalesce(c2.name, c2.clubName, '') AS clubName,
      e.createdAt AS createdAt,
      e.updatedAt AS updatedAt,
      tagNames AS tags
    ORDER BY e.createdAt DESC
    `,
    params
  );

  return result.map((r) => ({
    eventId: r.eventId,
    title: r.title,
    description: r.description,
    startAt: r.startAt,
    endAt: r.endAt,
    venue: r.venue,
    link: r.link,
    maxSlots: r.maxSlots,
    visibility: r.visibility as "public" | "institution" | "restricted",
    status: r.status as
      | "draft"
      | "pending"
      | "approved"
      | "published"
      | "rejected"
      | "hidden",
    imageUrl: r.imageUrl,
    posterId: r.posterId,
    posterName: r.posterName,
    clubId: r.clubId,
    clubName: r.clubName,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    tags: r.tags?.filter((t) => t) || [],
  }));
}

/**
 * Get event statistics for institution
 */
export async function getInstitutionEventStats(
  institutionId: string
): Promise<InstitutionEventStats> {
  const result = await runQuery<{
    total: number;
    published: number;
    pending: number;
    rejected: number;
    draft: number;
  }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Get events directly from institution
    OPTIONAL MATCH (e1:Event)-[:BELONGS_TO]->(i)
    
    // Get events from clubs
    OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event)
    
    // Combine both types
    WITH i, collect(DISTINCT e1) AS directEvents, collect(DISTINCT e2) AS clubEvents
    WITH i, directEvents + clubEvents AS allEvents
    UNWIND allEvents AS e
    WHERE e IS NOT NULL AND e.status <> "deleted"
    
    WITH 
      COUNT(DISTINCT e) AS total,
      COUNT(CASE WHEN e.status IN ["published", "approved"] THEN 1 END) AS published,
      COUNT(CASE WHEN e.status = "pending" THEN 1 END) AS pending,
      COUNT(CASE WHEN e.status = "rejected" THEN 1 END) AS rejected,
      COUNT(CASE WHEN e.status = "draft" THEN 1 END) AS draft
    RETURN total, published, pending, rejected, draft
    `,
    { institutionId }
  );

  const stats = result[0];
  return {
    total: stats?.total || 0,
    published: stats?.published || 0,
    pending: stats?.pending || 0,
    rejected: stats?.rejected || 0,
    draft: stats?.draft || 0,
  };
}

/**
 * Get single event details with full information
 */
export async function getInstitutionEventDetails(
  eventId: string,
  institutionId: string
): Promise<InstitutionEventDetails | null> {
  const result = await runQuery<{
    eventId: string;
    title: string;
    description: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    link?: string;
    maxSlots?: number;
    visibility: string;
    status: string;
    imageUrl?: string;
    posterId: string;
    posterName: string;
    clubId?: string;
    clubName?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    goingCount: number;
    interestedCount: number;
    checkedInCount: number;
  }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    
    // Find event - either directly from institution or from a club
    OPTIONAL MATCH (e1:Event {eventId: $eventId})-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event {eventId: $eventId})
    
    WITH i, coalesce(e1, e2) AS e
    WHERE e IS NOT NULL
    
    // Get club info if event is from a club
    OPTIONAL MATCH (c2:Club)-[:HOSTS]->(e)
    OPTIONAL MATCH (c2)-[:BELONGS_TO]->(i)
    
    // Get tags
    OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
    
    // Get RSVP counts
    OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
    OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
    OPTIONAL MATCH (checkedInUser:User)-[:CHECKED_IN]->(e)
    
    WITH e, c2, 
      collect(DISTINCT t.name) AS tagNames,
      COUNT(DISTINCT goingUser) AS goingCount,
      COUNT(DISTINCT interestedUser) AS interestedCount,
      COUNT(DISTINCT checkedInUser) AS checkedInCount
    
    RETURN 
      e.eventId AS eventId,
      e.title AS title,
      e.description AS description,
      e.startAt AS startAt,
      e.endAt AS endAt,
      e.venue AS venue,
      e.link AS link,
      e.maxSlots AS maxSlots,
      coalesce(e.visibility, "public") AS visibility,
      coalesce(e.status, "pending") AS status,
      e.imageUrl AS imageUrl,
      e.posterId AS posterId,
      coalesce(e.posterName, "") AS posterName,
      c2.clubId AS clubId,
      coalesce(c2.name, c2.clubName, "") AS clubName,
      e.createdAt AS createdAt,
      e.updatedAt AS updatedAt,
      tagNames AS tags,
      goingCount,
      interestedCount,
      checkedInCount
    LIMIT 1
    `,
    { eventId, institutionId }
  );

  if (!result.length) {
    return null;
  }

  const r = result[0];
  return {
    eventId: r.eventId,
    title: r.title,
    description: r.description,
    startAt: r.startAt,
    endAt: r.endAt,
    venue: r.venue,
    link: r.link,
    maxSlots: r.maxSlots,
    visibility: r.visibility as "public" | "institution" | "restricted",
    status: r.status as
      | "draft"
      | "pending"
      | "approved"
      | "published"
      | "rejected"
      | "hidden",
    imageUrl: r.imageUrl,
    posterId: r.posterId,
    posterName: r.posterName,
    clubId: r.clubId,
    clubName: r.clubName,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    tags: r.tags?.filter((t) => t) || [],
    goingCount: r.goingCount || 0,
    interestedCount: r.interestedCount || 0,
    checkedInCount: r.checkedInCount || 0,
  };
}

/**
 * Get all clubs for an institution (for dropdown)
 */
export async function getInstitutionClubsForDropdown(
  institutionId: string
): Promise<Array<{ clubId: string; name: string; acronym?: string }>> {
  const result = await runQuery<{
    clubId: string;
    name: string;
    acronym?: string;
  }>(
    `
    MATCH (c:Club)-[:BELONGS_TO]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      AND coalesce(c.status, "pending") = "approved"
    RETURN 
      c.clubId AS clubId,
      coalesce(c.name, c.clubName, "") AS name,
      coalesce(c.acronym, c.clubAcr) AS acronym
    ORDER BY c.name ASC, c.clubName ASC
    `,
    { institutionId }
  );

  return result;
}