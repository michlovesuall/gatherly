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

    // Verify club belongs to institution
    const clubCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (c:Club {clubId: $clubId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COUNT(c) > 0 AS exists
      `,
      { clubId, institutionId }
    );

    if (!clubCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Club not found or does not belong to this institution" },
        { status: 404 }
      );
    }

    // Check if club has an advisor
    const advisorCheck = await runQuery<{
      employeeId: string;
      employeeName: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})<-[:ADVISES]-(a:User)
      RETURN a.userId AS employeeId, a.name AS employeeName
      LIMIT 1
      `,
      { clubId }
    );

    if (!advisorCheck.length) {
      return NextResponse.json(
        { ok: false, error: "Club does not have an advisor assigned" },
        { status: 400 }
      );
    }

    // Delete ADVISES relationship
    const result = await runQuery<{
      clubId: string;
      clubName: string;
      employeeId: string;
      employeeName: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})<-[a:ADVISES]-(e:User)
      WITH c, e, a
      DELETE a
      RETURN c.clubId AS clubId, c.name AS clubName, e.userId AS employeeId, e.name AS employeeName
      `,
      { clubId }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to unassign advisor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Advisor unassigned successfully",
      club: {
        clubId: result[0].clubId,
        clubName: result[0].clubName,
      },
      advisor: {
        employeeId: result[0].employeeId,
        employeeName: result[0].employeeName,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

