import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string; employeeId: string }> }
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

    const { clubId, employeeId } = await params;
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

    // Verify employee belongs to institution and is approved
    const employeeCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (e:User {userId: $employeeId, platformRole: "employee"})-[m:MEMBER_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(m.status, "pending") = "approved"
      RETURN COUNT(e) > 0 AS exists
      `,
      { employeeId, institutionId }
    );

    if (!employeeCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Employee not found or not an approved member of this institution" },
        { status: 404 }
      );
    }

    // Check if employee is already an advisor for this club
    const existingAdvisor = await runQuery<{ exists: boolean }>(
      `
      MATCH (e:User {userId: $employeeId})-[a:ADVISES]->(c:Club {clubId: $clubId})
      RETURN COUNT(a) > 0 AS exists
      `,
      { employeeId, clubId }
    );

    if (existingAdvisor[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Employee is already an advisor for this club" },
        { status: 400 }
      );
    }

    // Create ADVISES relationship
    const result = await runQuery<{
      employeeId: string;
      employeeName: string;
      clubId: string;
      clubName: string;
    }>(
      `
      MATCH (e:User {userId: $employeeId})
      MATCH (c:Club {clubId: $clubId})
      MERGE (e)-[:ADVISES]->(c)
      RETURN e.userId AS employeeId, e.name AS employeeName, c.clubId AS clubId, c.name AS clubName
      `,
      { employeeId, clubId }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to assign advisor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      advisor: {
        employeeId: result[0].employeeId,
        employeeName: result[0].employeeName,
        clubId: result[0].clubId,
        clubName: result[0].clubName,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

