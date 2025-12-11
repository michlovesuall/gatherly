import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { RELATIONSHIP_STATUS } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "institution") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const institutionId = session.institutionId || session.userId;
    const now = new Date().toISOString();

    // Update member status to rejected (checking all relationship types: STUDENT, EMPLOYEE, MEMBER_OF)
    const result = await runQuery<{
      userId: string;
      name: string;
      memberStatus: string;
    }>(
      `
      MATCH (u:User {userId: $userId})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      SET r.status = $rejectedStatus,
          r.updatedAt = $now
      WITH u, r
      RETURN u.userId AS userId, u.name AS name, r.status AS memberStatus
      LIMIT 1
      `,
      { userId: id, institutionId, rejectedStatus: RELATIONSHIP_STATUS.REJECTED, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "User not found or not a member of this institution" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result[0].userId,
        name: result[0].name,
        memberStatus: result[0].memberStatus,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

