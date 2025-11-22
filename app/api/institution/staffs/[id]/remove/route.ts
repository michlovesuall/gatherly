import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

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

    // Check if employee is a staff
    const staffCheck = await runQuery<{
      userId: string;
      name: string;
    }>(
      `
      MATCH (u:User {userId: $userId})-[s:IS_STAFF_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN u.userId AS userId, u.name AS name
      LIMIT 1
      `,
      { userId: id, institutionId }
    );

    if (!staffCheck.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Employee is not assigned as staff for this institution",
        },
        { status: 404 }
      );
    }

    // Delete IS_STAFF_OF relationship
    const result = await runQuery<{
      userId: string;
      name: string;
    }>(
      `
      MATCH (u:User {userId: $userId})-[s:IS_STAFF_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      DELETE s
      RETURN u.userId AS userId, u.name AS name
      `,
      { userId: id, institutionId }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to remove staff" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result[0].userId,
        name: result[0].name,
        isStaff: false,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
