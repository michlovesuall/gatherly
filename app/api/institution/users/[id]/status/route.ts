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

    const { status } = await req.json();

    if (status !== "active" && status !== "disabled") {
      return NextResponse.json(
        { ok: false, error: "Invalid status. Must be 'active' or 'disabled'" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const institutionId = session.institutionId || session.userId;
    const now = new Date().toISOString();

    // Update user status (only for users that are members of this institution)
    const result = await runQuery<{
      userId: string;
      name: string;
      status: string;
    }>(
      `
      MATCH (u:User {userId: $userId})-[m:MEMBER_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(m.status, "pending") = "approved"
      SET u.status = $status,
          u.updatedAt = $now
      RETURN u.userId AS userId, u.name AS name, u.status AS status
      `,
      { userId: id, institutionId, status, now }
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

