import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string; memberId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "employee" && session.role !== "staff") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId, memberId } = await params;

    // Verify advisor is assigned to this club
    const advisorCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (advisor:User {userId: $advisorId})-[:ADVISES]->(c:Club {clubId: $clubId})
      RETURN COUNT(advisor) > 0 AS exists
      `,
      { advisorId: session.userId, clubId }
    );

    if (!advisorCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "You are not an advisor for this club" },
        { status: 403 }
      );
    }

    // Verify member belongs to club
    const memberCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (m:User {userId: $memberId})-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      RETURN COUNT(mc) > 0 AS exists
      `,
      { memberId, clubId }
    );

    if (!memberCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Member not found in this club" },
        { status: 404 }
      );
    }

    // Delete MEMBER_OF_CLUB relationship
    const result = await runQuery<{
      userId: string;
      name: string;
    }>(
      `
      MATCH (m:User {userId: $memberId})-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      DELETE mc
      RETURN m.userId AS userId, m.name AS name
      `,
      { memberId, clubId }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Member removed successfully",
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

