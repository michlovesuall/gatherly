import { cookies } from "next/headers";
import { runQuery } from "@/lib/neo4j";
import type {
  SessionUser,
  ClubMembership,
  EmployeeScope,
  InstitutionMembership,
} from "@/lib/rbac";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  // Try user-based session first
  const rows = await runQuery<{
    userId: string;
    name: string;
    avatarUrl?: string;
    platformRole: "student" | "employee" | "institution" | "super_admin";
    institutionId: string;
    institutionStatus: "pending" | "auto_verified" | "approved" | "rejected";
    clubId?: string;
    clubName?: string;
    clubRole?: string;
    isStaff?: boolean;
    advisorClubIds?: string[];
  }>(
    `
    MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(u)
    OPTIONAL MATCH (u)-[:MEMBER_OF]->(i:Institution)
    OPTIONAL MATCH (u)-[mc:MEMBER_OF_CLUB]->(c:Club)
    OPTIONAL MATCH (u)-[:ADVISES]->(advisedClub:Club)
    WITH u, i, 
         collect(DISTINCT {clubId: c.clubId, clubName: c.name, clubAcronym: coalesce(c.acronym, c.clubAcr), role: coalesce(mc.role, "member")}) AS clubs,
         collect(DISTINCT advisedClub.clubId) AS advisorClubIds
    OPTIONAL MATCH (u)-[staffRel:IS_STAFF_OF]->(i)
    WITH u, i, clubs, advisorClubIds,
         CASE WHEN staffRel IS NOT NULL THEN true ELSE false END AS isStaff
    RETURN u.userId AS userId,
           u.name AS name,
           u.avatarUrl AS avatarUrl,
           coalesce(toLower(u.platformRole), "student") AS platformRole,
           coalesce(i.institutionId, "") AS institutionId,
           coalesce(i.status, "approved") AS institutionStatus,
           isStaff,
           advisorClubIds,
           clubs
    LIMIT 1
    `,
    { token }
  );

  // Fallback to institution session if no User session exists
  if (!rows.length) {
    const inst = await runQuery<{
      institutionId: string;
      institutionName: string;
    }>(
      `
      MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(i:User {platformRole: "institution"})
      RETURN i.userId AS institutionId,
             coalesce(i.name, "Institution") AS institutionName
      LIMIT 1
      `,
      { token }
    );
    if (!inst.length) {
      // Legacy fallback: Institution-labeled node
      const legacy = await runQuery<{
        institutionId: string;
        institutionName: string;
      }>(
        `
        MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(i:Institution)
        RETURN coalesce(i.userId, i.institutionId) AS institutionId,
               coalesce(i.name, i.institutionName, "Institution") AS institutionName
        LIMIT 1
        `,
        { token }
      );
      if (!legacy.length) return null;
      const l = legacy[0];
      const user: SessionUser = {
        userId: l.institutionId,
        name: l.institutionName,
        platformRole: "institution",
        institution: { institutionId: l.institutionId, status: "approved" },
        clubs: [],
      } as SessionUser;
      return user;
    }
    const i = inst[0];
    const user: SessionUser = {
      userId: i.institutionId,
      name: i.institutionName,
      platformRole: "institution",
      institution: { institutionId: i.institutionId, status: "approved" },
      clubs: [],
    } as SessionUser;
    return user;
  }

  const row: any = rows[0];
  const clubs: ClubMembership[] = Array.isArray(row.clubs)
    ? row.clubs
        .filter((c: any) => c && c.clubId)
        .map((c: any) => ({
          clubId: c.clubId,
          clubName: c.clubName,
          clubAcronym: c.clubAcronym || undefined,
          role: (c.role === "officer"
            ? "officer"
            : "member") as ClubMembership["role"],
        }))
    : [];

  // Calculate employeeScope for employees
  const employeeScope: EmployeeScope | undefined =
    row.platformRole === "employee"
      ? {
          isStaff: row.isStaff === true,
          isAdvisor:
            Array.isArray(row.advisorClubIds) && row.advisorClubIds.length > 0,
          advisorClubIds: Array.isArray(row.advisorClubIds)
            ? row.advisorClubIds.filter((id: any) => id)
            : [],
        }
      : undefined;

  const institution: InstitutionMembership = {
    institutionId: row.institutionId,
    status: row.institutionStatus,
  };

  const user: SessionUser = {
    userId: row.userId,
    name: row.name,
    avatarUrl: row.avatarUrl,
    platformRole: row.platformRole,
    institution,
    clubs,
    employeeScope,
  };
  return user;
}
