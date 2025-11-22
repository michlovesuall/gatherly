import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

/**
 * DELETE /api/institution/programs/[programId]
 * Delete a program
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ programId: string }> }
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

    const institutionId = session.institutionId || session.userId;
    const { programId } = await params;

    // Verify program belongs to institution
    const programCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (p:Program {programId: $programId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COUNT(p) > 0 AS exists
      LIMIT 1
      `,
      { programId, institutionId }
    );

    if (!programCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Program not found" },
        { status: 404 }
      );
    }

    // Delete program and all relationships
    await runQuery(
      `
      MATCH (p:Program {programId: $programId})
      DETACH DELETE p
      `,
      { programId }
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

