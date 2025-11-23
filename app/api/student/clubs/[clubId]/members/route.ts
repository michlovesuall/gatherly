import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user is president (officer) of the club
    const presidentCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (u:User {userId: $userId})-[mc:MEMBER_OF_CLUB {role: "officer"}]->(c:Club {clubId: $clubId})
      RETURN COUNT(mc) > 0 AS exists
      `,
      { userId: session.userId, clubId }
    );

    if (!presidentCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "You are not a president of this club" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await runQuery<{ exists: boolean }>(
      `
      MATCH (m:User {userId: $userId})-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      RETURN COUNT(mc) > 0 AS exists
      `,
      { userId, clubId }
    );

    if (existingMember[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "User is already a member of this club" },
        { status: 400 }
      );
    }

    // Verify user is a student in the same institution
    const clubInstitution = await runQuery<{
      institutionId: string;
      userId: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})-[:BELONGS_TO]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COALESCE(i.institutionId, i.userId) AS institutionId, i.userId AS userId
      LIMIT 1
      `,
      { clubId }
    );

    if (!clubInstitution.length) {
      return NextResponse.json(
        { ok: false, error: "Club not found or has no institution" },
        { status: 404 }
      );
    }

    const institutionId = clubInstitution[0].institutionId || clubInstitution[0].userId;

    const studentCheck = await runQuery<{
      exists: boolean;
      name: string;
    }>(
      `
      MATCH (s:User {userId: $userId})-[:MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND s.platformRole = "student"
      RETURN COUNT(s) > 0 AS exists, s.name AS name
      LIMIT 1
      `,
      { userId, institutionId }
    );

    if (!studentCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "User is not a student in this institution" },
        { status: 403 }
      );
    }

    // Add member to club
    const now = new Date().toISOString();
    const result = await runQuery<{
      userId: string;
      name: string;
    }>(
      `
      MATCH (s:User {userId: $userId})
      MATCH (c:Club {clubId: $clubId})
      CREATE (s)-[:MEMBER_OF_CLUB {
        role: "member",
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(c)
      RETURN s.userId AS userId, s.name AS name
      `,
      { userId, clubId, createdAt: now, updatedAt: now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to add member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Member added successfully",
      member: {
        userId: result[0].userId,
        name: result[0].name,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

