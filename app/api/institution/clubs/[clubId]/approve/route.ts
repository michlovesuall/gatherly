import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
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

    if (session.role !== "institution") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId } = await params;
    const institutionId = session.institutionId || session.userId;
    const now = new Date().toISOString();

    // Verify club belongs to institution and is pending
    const clubCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (c:Club {clubId: $clubId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(c.status, "pending") = "pending"
      RETURN COUNT(c) > 0 AS exists
      `,
      { clubId, institutionId }
    );

    if (!clubCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Club not found, does not belong to this institution, or is not pending approval" },
        { status: 404 }
      );
    }

    // Update club status to approved
    const result = await runQuery<{
      clubId: string;
      name: string;
      status: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      SET c.status = "approved",
          c.updatedAt = $now,
          c.updated_at = $now
      RETURN c.clubId AS clubId, coalesce(c.name, c.clubName, "") AS name, c.status AS status
      `,
      { clubId, institutionId, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to approve club" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      club: {
        id: result[0].clubId,
        name: result[0].name,
        status: result[0].status,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

