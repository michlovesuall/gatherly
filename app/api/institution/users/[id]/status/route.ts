import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { RELATIONSHIP_STATUS, USER_STATUS } from "@/lib/constants";

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

    const { status } = await req.json();

    if (status !== USER_STATUS.ACTIVE && status !== USER_STATUS.DISABLED) {
      return NextResponse.json(
        { ok: false, error: `Invalid status. Must be '${USER_STATUS.ACTIVE}' or '${USER_STATUS.DISABLED}'` },
        { status: 400 }
      );
    }

    const { id } = await params;
    const institutionId = session.institutionId || session.userId;
    const now = new Date().toISOString();

    // Update user status (checking all relationship types: STUDENT, EMPLOYEE, MEMBER_OF)
    // Only update if relationship status is "active" (approved members)
    const result = await runQuery<{
      userId: string;
      name: string;
      status: string;
    }>(
      `
      MATCH (u:User {userId: $userId})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(r.status, $pendingStatus) = $activeStatus
      SET u.status = $status,
          u.updatedAt = $now
      WITH u, r
      RETURN u.userId AS userId, u.name AS name, u.status AS status
      LIMIT 1
      `,
      {
        userId: id,
        institutionId,
        status,
        activeStatus: RELATIONSHIP_STATUS.ACTIVE,
        pendingStatus: RELATIONSHIP_STATUS.PENDING,
        now,
      }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "User not found or not an approved member of this institution" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result[0].userId,
        name: result[0].name,
        status: result[0].status,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

