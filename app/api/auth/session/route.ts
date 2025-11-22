import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runQuery } from "@/lib/neo4j";
import { ensureSuperAdmin } from "@/lib/auth/ensure-super-admin";

export async function GET() {
  // Opportunistically ensure super_admin exists
  await ensureSuperAdmin({ hardenExisting: true });
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    // Try user sessions first
    const result = await runQuery<{
      userId: string;
      name: string;
      email: string;
      role: string;
      avatarUrl?: string;
      isStaff?: boolean;
      advisorClubIds?: string[];
    }>(
      `
      MATCH (s:Session {token: $token})
      MATCH (u:User)-[:HAS_SESSION]->(s)
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(i:Institution)
      OPTIONAL MATCH (u)-[:ADVISES]->(advisedClub:Club)
      WITH u, i, advisedClub
      WITH u, i, 
           CASE 
             WHEN advisedClub IS NOT NULL AND coalesce(advisedClub.status, "pending") = "approved" 
             THEN advisedClub.clubId 
             ELSE null 
           END AS approvedClubId
      WITH u, i, collect(DISTINCT approvedClubId) AS allAdvisorClubIds
      WITH u, i, [clubId IN allAdvisorClubIds WHERE clubId IS NOT NULL] AS advisorClubIds
      OPTIONAL MATCH (u)-[staffRel:IS_STAFF_OF]->(i)
      WITH u, i, advisorClubIds,
           CASE WHEN staffRel IS NOT NULL THEN true ELSE false END AS isStaff
      RETURN u.userId AS userId,
             u.name AS name,
             u.email AS email,
             coalesce(toLower(u.platformRole), "student") AS role,
             u.avatarUrl AS avatarUrl,
             isStaff,
             advisorClubIds
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (result.length) {
      const user = result[0];
      const employeeScope =
        user.role === "employee"
          ? {
              isStaff: user.isStaff === true,
              isAdvisor:
                Array.isArray(user.advisorClubIds) &&
                user.advisorClubIds.length > 0,
              advisorClubIds: Array.isArray(user.advisorClubIds)
                ? user.advisorClubIds.filter((id: any) => id)
                : [],
            }
          : undefined;

      return NextResponse.json({
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatarUrl,
          employeeScope,
        },
      });
    }

    // Fallback to institution sessions (User-labeled)
    const inst = await runQuery<{
      institutionId: string;
      institutionName: string;
    }>(
      `
      MATCH (s:Session {token: $token})
      MATCH (i:User {platformRole: "institution"})-[:HAS_SESSION]->(s)
      RETURN i.userId AS institutionId,
             coalesce(i.name, "Institution") AS institutionName
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (inst.length) {
      const i = inst[0];
      return NextResponse.json({
        user: {
          userId: i.institutionId,
          name: i.institutionName,
          email: "",
          role: "institution",
          avatar: undefined,
        },
      });
    }

    // Legacy fallback: Institution-labeled node
    const instLegacy = await runQuery<{
      institutionId: string;
      institutionName: string;
    }>(
      `
      MATCH (s:Session {token: $token})
      MATCH (i:Institution)-[:HAS_SESSION]->(s)
      RETURN coalesce(i.userId, i.institutionId) AS institutionId,
             coalesce(i.name, i.institutionName, "Institution") AS institutionName
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (instLegacy.length) {
      const i = instLegacy[0];
      return NextResponse.json({
        user: {
          userId: i.institutionId,
          name: i.institutionName,
          email: "",
          role: "institution",
          avatar: undefined,
        },
      });
    }

    return NextResponse.json({ user: null }, { status: 200 });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
