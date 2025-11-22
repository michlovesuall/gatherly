import { runQuery } from "@/lib/neo4j";

export interface StudentContext {
  studentName: string;
  institutionName: string;
  avatarUrl?: string;
  clubsCount: number;
}

export interface EventItem {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  venue?: string;
  tags?: string[];
  visibility: "public" | "institution" | "restricted";
  counts?: { going: number; interested: number; checkedIn: number };
  rsvpState?: "going" | "interested" | null;
}

export interface Certificate {
  id: string;
  title: string;
  issuedAt: string;
  url?: string;
}

export interface Club {
  id: string;
  name: string;
  tags?: string[];
  advisor?: string;
  nextEvent?: { id: string; title: string; startAt: string };
}

export interface ClubAnnouncement {
  id: string;
  clubName: string;
  title: string;
  createdAt: string;
}

/**
 * Get student core context (name, institution, clubsCount)
 */
export async function getStudentContext(
  userId: string
): Promise<StudentContext> {
  const result = await runQuery<{
    studentName: string;
    institutionName: string;
    avatarUrl?: string;
    clubsCount: number;
  }>(
    `
    MATCH (u:User {userId: $userId})
    OPTIONAL MATCH (u)-[:MEMBER_OF]->(i)
    OPTIONAL MATCH (u)-[:MEMBER_OF_CLUB]->(c:Club {status: "approved"})
    RETURN u.name AS studentName, 
           COALESCE(i.name, i.institutionName, "") AS institutionName,
           COALESCE(u.avatarUrl, "") AS avatarUrl,
           COUNT(DISTINCT c) AS clubsCount
    `,
    { userId }
  );

  const r = result[0];
  return {
    studentName: r?.studentName || "Student",
    institutionName: r?.institutionName || "",
    avatarUrl: r?.avatarUrl || "",
    clubsCount: r?.clubsCount || 0,
  };
}

/**
 * Get event feed (public + institution scoped for this user's institution)
 */
export async function getEventFeed(
  userId: string,
  institutionId: string,
  limit = 20
): Promise<EventItem[]> {
  const result = await runQuery<{
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    visibility: string;
    counts: { going: number; interested: number; checkedIn: number };
    rsvpState?: string;
  }>(
    `
    MATCH (i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    MATCH (e:Event)-[:BELONGS_TO]->(i)
    WHERE e.visibility IN ["public", "institution"]
      AND e.status IN ["approved", "published"]
      AND e.startAt >= datetime() - duration({days: 7})
    OPTIONAL MATCH (u:User {userId: $userId})-[:RSVP]->(r:RSVP)-[:FOR]->(e)
    WITH e, u, r,
      CASE 
        WHEN r.state = "going" THEN "going"
        WHEN r.state = "interested" THEN "interested"
        ELSE null
      END AS rsvpState
    OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
    OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
    OPTIONAL MATCH (checkedInUser:User)-[:CHECKED_IN]->(e)
    WITH e, rsvpState,
      COUNT(DISTINCT goingUser) AS going,
      COUNT(DISTINCT interestedUser) AS interested,
      COUNT(DISTINCT checkedInUser) AS checkedIn
    RETURN e.eventId AS id,
           e.title AS title,
           e.startAt AS startAt,
           e.endAt AS endAt,
           e.venue AS venue,
           e.visibility AS visibility,
           {going: going, interested: interested, checkedIn: checkedIn} AS counts,
           rsvpState
    ORDER BY e.startAt ASC
    LIMIT $limit
    `,
    { userId, institutionId, limit }
  );

  return result.map((r) => ({
    id: r.id,
    title: r.title,
    startAt: r.startAt,
    endAt: r.endAt,
    venue: r.venue,
    visibility: r.visibility as EventItem["visibility"],
    counts: r.counts,
    rsvpState: r.rsvpState as EventItem["rsvpState"],
  }));
}

/**
 * Get my events (Going/Interested)
 */
export async function getMyEvents(userId: string): Promise<{
  going: EventItem[];
  interested: EventItem[];
}> {
  const going = await runQuery<{
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    visibility: string;
  }>(
    `
    MATCH (u:User {userId: $userId})-[:RSVP]->(r:RSVP {state: "going"})-[:FOR]->(e:Event)
    RETURN e.eventId AS id,
           e.title AS title,
           e.startAt AS startAt,
           e.endAt AS endAt,
           e.venue AS venue,
           e.visibility AS visibility
    ORDER BY e.startAt ASC
    LIMIT 50
    `,
    { userId }
  );

  const interested = await runQuery<{
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    visibility: string;
  }>(
    `
    MATCH (u:User {userId: $userId})-[:RSVP]->(r:RSVP {state: "interested"})-[:FOR]->(e:Event)
    RETURN e.eventId AS id,
           e.title AS title,
           e.startAt AS startAt,
           e.endAt AS endAt,
           e.venue AS venue,
           e.visibility AS visibility
    ORDER BY e.startAt ASC
    LIMIT 50
    `,
    { userId }
  );

  return {
    going: going.map((r) => ({
      id: r.id,
      title: r.title,
      startAt: r.startAt,
      endAt: r.endAt,
      venue: r.venue,
      visibility: r.visibility as EventItem["visibility"],
    })),
    interested: interested.map((r) => ({
      id: r.id,
      title: r.title,
      startAt: r.startAt,
      endAt: r.endAt,
      venue: r.venue,
      visibility: r.visibility as EventItem["visibility"],
    })),
  };
}

/**
 * Get certificates (latest 3)
 */
export async function getCertificates(userId: string): Promise<Certificate[]> {
  const result = await runQuery<{
    id: string;
    title: string;
    issuedAt: string;
    url?: string;
  }>(
    `
    MATCH (u:User {userId: $userId})-[:HAS_CERTIFICATE]->(c:Certificate)
    OPTIONAL MATCH (c)-[:FOR_EVENT]->(e:Event)
    RETURN c.certificateId AS id,
           COALESCE(e.title, "Event Certificate") AS title,
           c.issuedAt AS issuedAt,
           c.url AS url
    ORDER BY c.issuedAt DESC
    LIMIT 3
    `,
    { userId }
  );

  return result.map((r) => ({
    id: r.id,
    title: r.title,
    issuedAt: r.issuedAt,
    url: r.url,
  }));
}

/**
 * Get clubs where user is member
 */
export async function getMyClubs(userId: string): Promise<Club[]> {
  const result = await runQuery<{
    id: string;
    name: string;
    tags?: string[];
    advisor?: string;
    nextEvent?: { id: string; title: string; startAt: string };
  }>(
    `
    MATCH (u:User {userId: $userId})-[:MEMBER_OF_CLUB]->(c:Club {status: "approved"})
    OPTIONAL MATCH (c)<-[:ADVISES]-(a:User)
    OPTIONAL MATCH (c)-[:HOSTS]->(e:Event)
    WHERE e.status IN ["approved", "published"]
      AND e.startAt >= datetime()
    WITH c, a, e
    ORDER BY e.startAt ASC
    WITH c, a, HEAD(COLLECT({id: e.eventId, title: e.title, startAt: e.startAt})) AS nextEvent
    RETURN c.clubId AS id,
           c.name AS name,
           c.tags AS tags,
           a.name AS advisor,
           nextEvent
    LIMIT 25
    `,
    { userId }
  );

  return result.map((r) => ({
    id: r.id,
    name: r.name,
    tags: r.tags || [],
    advisor: r.advisor,
    nextEvent: r.nextEvent,
  }));
}

/**
 * Get announcements from joined clubs (latest 5)
 */
export async function getClubAnnouncements(
  userId: string
): Promise<ClubAnnouncement[]> {
  const result = await runQuery<{
    id: string;
    clubName: string;
    title: string;
    createdAt: string;
  }>(
    `
    MATCH (u:User {userId: $userId})-[:MEMBER_OF_CLUB]->(c:Club {status: "approved"})
    MATCH (c)-[:BELONGS_TO]->(i)<-[:BELONGS_TO]-(a:Announcement)
    WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      AND a.status = "published"
    RETURN a.announcementId AS id,
           c.name AS clubName,
           a.title AS title,
           a.createdAt AS createdAt
    ORDER BY a.createdAt DESC
    LIMIT 5
    `,
    { userId }
  );

  return result.map((r) => ({
    id: r.id,
    clubName: r.clubName,
    title: r.title,
    createdAt: r.createdAt,
  }));
}

/**
 * Get recommended events (simple: events with tags matching user interests)
 */
export async function getRecommendedEvents(
  userId: string,
  institutionId: string,
  limit = 6
): Promise<EventItem[]> {
  const result = await runQuery<{
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    visibility: string;
    counts: { going: number; interested: number; checkedIn: number };
    going: number;
    interested: number;
  }>(
    `
    MATCH (u:User {userId: $userId})-[:INTERESTED_IN]->(t:Tag)
    MATCH (e:Event)-[:HAS_TAG]->(t)
    WHERE e.visibility IN ["public", "institution"]
      AND e.status IN ["approved", "published"]
      AND e.startAt >= datetime()
    OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
    OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
    WITH e,
      COUNT(DISTINCT goingUser) AS going,
      COUNT(DISTINCT interestedUser) AS interested
    RETURN e.eventId AS id,
           e.title AS title,
           e.startAt AS startAt,
           e.endAt AS endAt,
           e.venue AS venue,
           e.visibility AS visibility,
           going,
           interested,
           {going: going, interested: interested, checkedIn: 0} AS counts
    ORDER BY going DESC, e.startAt ASC
    LIMIT $limit
    `,
    { userId, institutionId, limit }
  );

  return result.map((r) => ({
    id: r.id,
    title: r.title,
    startAt: r.startAt,
    endAt: r.endAt,
    venue: r.venue,
    visibility: r.visibility as EventItem["visibility"],
    counts: r.counts,
    rsvpState: null,
  }));
}

/**
 * Get notifications (latest 5)
 */
export async function getNotifications(userId: string): Promise<
  Array<{
    id: string;
    title: string;
    time: string;
    unread?: boolean;
  }>
> {
  const result = await runQuery<{
    id: string;
    title: string;
    createdAt: string;
    isRead: boolean;
  }>(
    `
    MATCH (u:User {userId: $userId})-[:HAS_NOTIFICATION]->(n:Notification)
    RETURN n.notificationId AS id,
           n.title AS title,
           n.createdAt AS createdAt,
           n.isRead AS isRead
    ORDER BY n.createdAt DESC
    LIMIT 5
    `,
    { userId }
  );

  const now = Date.now();
  return result.map((r) => ({
    id: r.id,
    title: r.title,
    time: formatRelativeTime(r.createdAt, now),
    unread: !r.isRead,
  }));
}

function formatRelativeTime(timestamp: string, now: number): string {
  try {
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(time).toLocaleDateString();
  } catch {
    return "Recently";
  }
}

export interface NewsfeedContext {
  userName: string;
  avatarUrl?: string;
  institutionName: string;
  departmentName?: string;
  departmentAcronym?: string;
  programName?: string;
  collegeName?: string;
}

/**
 * Get user context for newsfeed (name, avatar, institution, department, program, college)
 */
export async function getNewsfeedContext(
  userId: string
): Promise<NewsfeedContext> {
  const result = await runQuery<{
    userName: string;
    avatarUrl?: string;
    institutionName: string;
    departmentName?: string;
    departmentAcronym?: string;
    programName?: string;
    collegeName?: string;
  }>(
    `
    MATCH (u:User {userId: $userId})
    OPTIONAL MATCH (u)-[:MEMBER_OF]->(i)
    OPTIONAL MATCH (u)-[:ENROLLED_IN_DEPARTMENT]->(d:Department)
    OPTIONAL MATCH (u)-[:ENROLLED_IN_PROGRAM]->(p:Program)
    OPTIONAL MATCH (u)-[:ENROLLED_IN_COLLEGE]->(c:College)
    RETURN 
      u.name AS userName,
      u.avatarUrl AS avatarUrl,
      COALESCE(i.name, i.institutionName, "") AS institutionName,
      COALESCE(d.name, "") AS departmentName,
      COALESCE(d.acronym, "") AS departmentAcronym,
      COALESCE(p.name, "") AS programName,
      COALESCE(c.name, "") AS collegeName
    LIMIT 1
    `,
    { userId }
  );

  const r = result[0];
  return {
    userName: r?.userName || "User",
    avatarUrl: r?.avatarUrl || "",
    institutionName: r?.institutionName || "",
    departmentName: r?.departmentName || "",
    departmentAcronym: r?.departmentAcronym || "",
    programName: r?.programName || "",
    collegeName: r?.collegeName || "",
  };
}

export interface NewsfeedItem {
  type: "event" | "announcement";
  id: string;
  title: string;
  content?: string;
  createdAt: string;
  author?: string;
  authorType?: "institution" | "club";
  visibility: "public" | "institution" | "restricted";
  // Event-specific fields
  startAt?: string;
  endAt?: string;
  venue?: string;
  maxSlots?: number;
  counts?: { going: number; interested: number; checkedIn: number; likes?: number; comments?: number };
  rsvpState?: "going" | "interested" | null;
  // Announcement-specific fields
  clubName?: string;
}

/**
 * Get newsfeed items (events + announcements) with filtering
 */
export async function getNewsfeedItems(
  userId: string,
  institutionId: string,
  filter: "for-you" | "global" = "for-you",
  limit = 50
): Promise<NewsfeedItem[]> {
  // Get events
  const eventsQuery = filter === "for-you"
    ? `
    MATCH (e:Event)-[:BELONGS_TO]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      AND e.visibility IN ["public", "institution"]
      AND e.status IN ["approved", "published"]
      AND e.startAt >= datetime() - duration({days: 30})
    OPTIONAL MATCH (u:User {userId: $userId})-[:RSVP]->(r:RSVP)-[:FOR]->(e)
    WITH e, u, r,
      CASE 
        WHEN r.state = "going" THEN "going"
        WHEN r.state = "interested" THEN "interested"
        ELSE null
      END AS rsvpState
    OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
    OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
    OPTIONAL MATCH (checkedInUser:User)-[:CHECKED_IN]->(e)
    WITH e, rsvpState,
      COUNT(DISTINCT goingUser) AS going,
      COUNT(DISTINCT interestedUser) AS interested,
      COUNT(DISTINCT checkedInUser) AS checkedIn
    RETURN e.eventId AS id,
           e.title AS title,
           e.startAt AS startAt,
           e.endAt AS endAt,
           e.venue AS venue,
           e.visibility AS visibility,
           e.maxSlots AS maxSlots,
           {going: going, interested: interested, checkedIn: checkedIn} AS counts,
           rsvpState
    ORDER BY e.startAt DESC
    LIMIT $limit
    `
    : `
    MATCH (e:Event)
    WHERE e.visibility = "public"
      AND e.status IN ["approved", "published"]
      AND e.startAt >= datetime() - duration({days: 30})
    OPTIONAL MATCH (u:User {userId: $userId})-[:RSVP]->(r:RSVP)-[:FOR]->(e)
    WITH e, u, r,
      CASE 
        WHEN r.state = "going" THEN "going"
        WHEN r.state = "interested" THEN "interested"
        ELSE null
      END AS rsvpState
    OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
    OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
    OPTIONAL MATCH (checkedInUser:User)-[:CHECKED_IN]->(e)
    WITH e, rsvpState,
      COUNT(DISTINCT goingUser) AS going,
      COUNT(DISTINCT interestedUser) AS interested,
      COUNT(DISTINCT checkedInUser) AS checkedIn
    RETURN e.eventId AS id,
           e.title AS title,
           e.startAt AS startAt,
           e.endAt AS endAt,
           e.venue AS venue,
           e.visibility AS visibility,
           e.maxSlots AS maxSlots,
           {going: going, interested: interested, checkedIn: checkedIn} AS counts,
           rsvpState
    ORDER BY e.startAt DESC
    LIMIT $limit
    `;

  const eventsResult = await runQuery<{
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
    venue?: string;
    visibility: string;
    maxSlots?: number;
    counts: { going: number; interested: number; checkedIn: number };
    rsvpState?: string;
  }>(eventsQuery, { userId, institutionId, limit });

  // Get announcements
  const announcementsQuery = filter === "for-you"
    ? `
    MATCH (a:Announcement)
    WHERE a.status = "published"
      AND a.createdAt >= datetime() - duration({days: 30})
    OPTIONAL MATCH (a)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (a)-[:BELONGS_TO_CLUB]->(c:Club)
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(ci)
    OPTIONAL MATCH (a)<-[:CREATED]-(creator:User)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId) 
       OR (ci.userId = $institutionId OR ci.institutionId = $institutionId)
    RETURN a.announcementId AS id,
           a.title AS title,
           a.content AS content,
           a.createdAt AS createdAt,
           COALESCE(creator.name, i.name, i.institutionName, "") AS author,
           CASE 
             WHEN c IS NOT NULL THEN "club"
             WHEN i IS NOT NULL THEN "institution"
             ELSE "institution"
           END AS authorType,
           COALESCE(a.visibility, "institution") AS visibility,
           c.name AS clubName
    ORDER BY a.createdAt DESC
    LIMIT $limit
    `
    : `
    MATCH (a:Announcement)
    WHERE a.status = "published"
      AND a.createdAt >= datetime() - duration({days: 30})
    OPTIONAL MATCH (a)-[:BELONGS_TO]->(i)
    OPTIONAL MATCH (a)-[:BELONGS_TO_CLUB]->(c:Club)
    OPTIONAL MATCH (a)<-[:CREATED]-(creator:User)
    WHERE a.visibility = "public" OR (i.userId = $institutionId OR i.institutionId = $institutionId)
    RETURN a.announcementId AS id,
           a.title AS title,
           a.content AS content,
           a.createdAt AS createdAt,
           COALESCE(creator.name, i.name, i.institutionName, "") AS author,
           CASE 
             WHEN c IS NOT NULL THEN "club"
             WHEN i IS NOT NULL THEN "institution"
             ELSE "institution"
           END AS authorType,
           COALESCE(a.visibility, "institution") AS visibility,
           c.name AS clubName
    ORDER BY a.createdAt DESC
    LIMIT $limit
    `;

  const announcementsResult = await runQuery<{
    id: string;
    title: string;
    content?: string;
    createdAt: string;
    author?: string;
    authorType: string;
    visibility: string;
    clubName?: string;
  }>(announcementsQuery, { userId, institutionId, limit });

  // Combine and sort by creation date
  const items: NewsfeedItem[] = [
    ...eventsResult.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      createdAt: e.startAt,
      visibility: e.visibility as "public" | "institution" | "restricted",
      startAt: e.startAt,
      endAt: e.endAt,
      venue: e.venue,
      maxSlots: e.maxSlots,
      counts: e.counts,
      rsvpState: e.rsvpState as "going" | "interested" | null,
    })),
    ...announcementsResult.map((a) => ({
      type: "announcement" as const,
      id: a.id,
      title: a.title,
      content: a.content,
      createdAt: a.createdAt,
      author: a.author,
      authorType: a.authorType as "institution" | "club",
      visibility: a.visibility as "public" | "institution" | "restricted",
      clubName: a.clubName,
    })),
  ];

  // Sort by creation date (newest first)
  return items.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}