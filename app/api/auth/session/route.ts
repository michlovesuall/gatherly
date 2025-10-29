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
    }>(
      `
      MATCH (s:Session {token: $token})
      MATCH (u:User)-[:HAS_SESSION]->(s)
      RETURN u.userId AS userId,
             u.name AS name,
             u.email AS email,
             coalesce(toLower(u.platformRole), "student") AS role,
             u.avatarUrl AS avatarUrl
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (result.length) {
      const user = result[0];
      return NextResponse.json({
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatarUrl,
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
