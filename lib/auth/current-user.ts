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
  }>(
    `
    MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(u)
    OPTIONAL MATCH (u)-[:MEMBER_OF]->(i:Institution)
    OPTIONAL MATCH (u)-[mc:MEMBER_OF_CLUB]->(c:Club)
    WITH u, i, collect({clubId: c.clubId, clubName: c.name, role: coalesce(mc.role, "member")}) AS clubs
    RETURN u.userId AS userId,
           u.name AS name,
           u.avatarUrl AS avatarUrl,
           coalesce(u.platformRole, "student") AS platformRole,
           coalesce(i.institutionId, "") AS institutionId,
           coalesce(i.status, "approved") AS institutionStatus,
           clubs
    LIMIT 1
    `,
    { token }
  );

  if (!rows.length) return null;

  const row: any = rows[0];
  const clubs: ClubMembership[] = Array.isArray(row.clubs)
    ? row.clubs
        .filter((c: any) => c && c.clubId)
        .map((c: any) => ({
          clubId: c.clubId,
          clubName: c.clubName,
          role: (c.role === "officer"
            ? "officer"
            : "member") as ClubMembership["role"],
        }))
    : [];

  const employeeScope: EmployeeScope | undefined =
    row.platformRole === "employee"
      ? { isStaff: false, isAdvisor: false, advisorClubIds: [] }
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
