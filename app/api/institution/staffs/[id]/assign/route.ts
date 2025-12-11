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

    // Verify employee belongs to institution and is approved
    const employeeCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (u:User {userId: $userId, platformRole: "employee"})-[m:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(m.status, $pendingStatus) = $activeStatus
      RETURN COUNT(u) > 0 AS exists
      `,
      { 
        userId: id, 
        institutionId,
        pendingStatus: RELATIONSHIP_STATUS.PENDING,
        activeStatus: RELATIONSHIP_STATUS.ACTIVE
      }
    );

    if (!employeeCheck[0]?.exists) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "User not found or not an approved employee of this institution",
        },
        { status: 404 }
      );
    }

    // Check if employee is already a staff
    const existingStaff = await runQuery<{ exists: boolean }>(
      `
      MATCH (u:User {userId: $userId})-[s:IS_STAFF_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COUNT(s) > 0 AS exists
      `,
      { userId: id, institutionId }
    );

    if (existingStaff[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Employee is already assigned as staff" },
        { status: 400 }
      );
    }

    // Create IS_STAFF_OF relationship
    const result = await runQuery<{
      userId: string;
      name: string;
    }>(
      `
      MATCH (u:User {userId: $userId})
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      MERGE (u)-[:IS_STAFF_OF {createdAt: $now}]->(i)
      RETURN u.userId AS userId, u.name AS name
      `,
      { userId: id, institutionId, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to assign staff" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result[0].userId,
        name: result[0].name,
        isStaff: true,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
