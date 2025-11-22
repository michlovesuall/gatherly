import { runQuery } from "@/lib/neo4j";

export interface AdvisorClub {
  clubId: string;
  clubName: string;
  acronym?: string;
  logo?: string;
}

export interface ClubMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "member" | "officer";
  phone?: string;
}

export interface ClubPost {
  id: string;
  type: "event" | "announcement";
  title: string;
  content?: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorType: "advisor" | "member";
  status: "published" | "pending" | "draft";
  // Event-specific
  startAt?: string;
  endAt?: string;
  venue?: string;
}

export interface ClubDetails {
  clubId: string;
  clubName: string;
  acronym?: string;
  logo?: string;
  email?: string;
  phone?: string;
  advisorName: string;
  advisorId: string;
  memberCount: number;
}

/**
 * Get clubs that an employee advises
 */
export async function getAdvisorClubs(
  employeeId: string
): Promise<AdvisorClub[]> {
  const result = await runQuery<{
    clubId: string;
    clubName: string;
    acronym?: string;
    logo?: string;
  }>(
    `
    MATCH (e:User {userId: $employeeId})-[:ADVISES]->(c:Club)
    WHERE coalesce(c.status, "pending") = "approved"
    RETURN 
      c.clubId AS clubId,
      coalesce(c.name, c.clubName, "") AS clubName,
      coalesce(c.acronym, c.clubAcr) AS acronym,
      c.logo AS logo
    ORDER BY c.name ASC, c.clubName ASC
    `,
    { employeeId }
  );

  return result;
}

/**
 * Get club details for advisor dashboard
 */
export async function getAdvisorClubDetails(
  employeeId: string,
  clubId: string
): Promise<ClubDetails | null> {
  const result = await runQuery<{
    clubId: string;
    clubName: string;
    acronym?: string;
    logo?: string;
    email?: string;
    phone?: string;
    advisorName: string;
    advisorId: string;
    memberCount: number;
  }>(
    `
    MATCH (e:User {userId: $employeeId})-[:ADVISES]->(c:Club {clubId: $clubId})
    OPTIONAL MATCH (m:User)-[:MEMBER_OF_CLUB]->(c)
    WITH c, e, COUNT(DISTINCT m) AS memberCount
    RETURN 
      c.clubId AS clubId,
      coalesce(c.name, c.clubName, "") AS clubName,
      coalesce(c.acronym, c.clubAcr) AS acronym,
      c.logo AS logo,
      c.email AS email,
      c.phone AS phone,
      e.name AS advisorName,
      e.userId AS advisorId,
      memberCount
    LIMIT 1
    `,
    { employeeId, clubId }
  );

  if (!result.length) return null;

  return result[0];
}

/**
 * Get club members for advisor dashboard
 */
export async function getClubMembers(
  clubId: string,
  searchQuery?: string
): Promise<ClubMember[]> {
  const filters: string[] = [];
  const params: Record<string, unknown> = { clubId };

  if (searchQuery && searchQuery.trim()) {
    filters.push(
      `(toLower(m.name) CONTAINS $searchQuery OR toLower(m.email) CONTAINS $searchQuery)`
    );
    params.searchQuery = searchQuery.trim().toLowerCase();
  }

  const additionalFilters = filters.length
    ? `AND ${filters.join(" AND ")}`
    : "";

  const result = await runQuery<{
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    phone?: string;
  }>(
    `
    MATCH (m:User)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
    WHERE 1=1 ${additionalFilters}
    RETURN 
      m.userId AS userId,
      coalesce(m.name, "") AS name,
      coalesce(m.email, "") AS email,
      m.avatarUrl AS avatarUrl,
      coalesce(mc.role, "member") AS role,
      m.phone AS phone
    ORDER BY 
      CASE WHEN mc.role = "officer" THEN 0 ELSE 1 END,
      m.name ASC
    `,
    params
  );

  return result.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatarUrl,
    role: (r.role === "officer" ? "officer" : "member") as ClubMember["role"],
    phone: r.phone,
  }));
}

/**
 * Get club posts (events and announcements) for advisor dashboard
 */
export async function getClubPosts(clubId: string): Promise<ClubPost[]> {
  // Get events - include all posts (advisor all statuses, members all statuses for approval)
  const events = await runQuery<{
    id: string;
    title: string;
    content?: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    authorType: string;
    status: string;
    startAt?: string;
    endAt?: string;
    venue?: string;
  }>(
    `
    MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event)
    OPTIONAL MATCH (e)<-[:CREATED]-(creator:User)
    OPTIONAL MATCH (advisor:User)-[:ADVISES]->(c)
    WITH e, creator, advisor,
      CASE 
        WHEN advisor.userId = creator.userId THEN "advisor"
        ELSE "member"
      END AS authorType
    RETURN 
      e.eventId AS id,
      e.title AS title,
      e.description AS content,
      e.createdAt AS createdAt,
      coalesce(creator.userId, "") AS authorId,
      coalesce(creator.name, "") AS authorName,
      authorType,
      coalesce(e.status, "draft") AS status,
      e.startAt AS startAt,
      e.endAt AS endAt,
      e.venue AS venue
    ORDER BY e.createdAt DESC
    `,
    { clubId }
  );

  // Get announcements - include all posts (advisor all statuses, members all statuses for approval)
  const announcements = await runQuery<{
    id: string;
    title: string;
    content?: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    authorType: string;
    status: string;
  }>(
    `
    MATCH (a:Announcement)-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
    OPTIONAL MATCH (a)<-[:CREATED]-(creator:User)
    OPTIONAL MATCH (advisor:User)-[:ADVISES]->(c)
    WITH a, creator, advisor,
      CASE 
        WHEN advisor.userId = creator.userId THEN "advisor"
        ELSE "member"
      END AS authorType
    RETURN 
      a.announcementId AS id,
      a.title AS title,
      a.content AS content,
      a.createdAt AS createdAt,
      coalesce(creator.userId, "") AS authorId,
      coalesce(creator.name, "") AS authorName,
      authorType,
      coalesce(a.status, "draft") AS status
    ORDER BY a.createdAt DESC
    `,
    { clubId }
  );

  const posts: ClubPost[] = [
    ...events.map((e) => ({
      id: e.id,
      type: "event" as const,
      title: e.title,
      content: e.content,
      createdAt: e.createdAt,
      authorId: e.authorId,
      authorName: e.authorName,
      authorType: (e.authorType === "advisor" ? "advisor" : "member") as const,
      status: (e.status === "published"
        ? "published"
        : e.status === "pending"
        ? "pending"
        : "draft") as const,
      startAt: e.startAt,
      endAt: e.endAt,
      venue: e.venue,
    })),
    ...announcements.map((a) => ({
      id: a.id,
      type: "announcement" as const,
      title: a.title,
      content: a.content,
      createdAt: a.createdAt,
      authorId: a.authorId,
      authorName: a.authorName,
      authorType: (a.authorType === "advisor" ? "advisor" : "member") as const,
      status: (a.status === "published"
        ? "published"
        : a.status === "pending"
        ? "pending"
        : "draft") as const,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Most recent first
  });

  return posts;
}
