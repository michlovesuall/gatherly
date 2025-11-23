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
    const body = await req.json();
    const { role } = body;

    if (role !== "member" && role !== "officer") {
      return NextResponse.json(
        { ok: false, error: "Invalid role. Must be 'member' or 'officer'" },
        { status: 400 }
      );
    }

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
    const memberCheck = await runQuery<{ exists: boolean; currentRole: string }>(
      `
      MATCH (m:User {userId: $memberId})-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      RETURN COUNT(mc) > 0 AS exists, mc.role AS currentRole
      LIMIT 1
      `,
      { memberId, clubId }
    );

    if (!memberCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Member not found in this club" },
        { status: 404 }
      );
    }

    // If assigning as president (officer), check if there's already a president
    if (role === "officer") {
      const existingPresident = await runQuery<{ userId: string; name: string }>(
        `
        MATCH (m:User)-[mc:MEMBER_OF_CLUB {role: "officer"}]->(c:Club {clubId: $clubId})
        WHERE m.userId <> $memberId
        RETURN m.userId AS userId, m.name AS name
        LIMIT 1
        `,
        { memberId, clubId }
      );

      if (existingPresident.length > 0) {
        // Remove the old president's role first
        await runQuery(
          `
          MATCH (m:User {userId: $oldPresidentId})-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
          SET mc.role = "member"
          `,
          { oldPresidentId: existingPresident[0].userId, clubId }
        );
      }
    }

    // Update member role
    const now = new Date().toISOString();
    const result = await runQuery<{
      userId: string;
      name: string;
      role: string;
    }>(
      `
      MATCH (m:User {userId: $memberId})-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      SET mc.role = $role, mc.updatedAt = $updatedAt
      RETURN m.userId AS userId, m.name AS name, mc.role AS role
      `,
      { memberId, clubId, role, updatedAt: now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to reassign member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Member role updated successfully",
      member: {
        userId: result[0].userId,
        name: result[0].name,
        role: result[0].role,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

