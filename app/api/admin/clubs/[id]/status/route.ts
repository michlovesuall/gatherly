import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { action } = await req.json();

    if (action !== "approve" && action !== "suspend") {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'approve' or 'suspend'" },
        { status: 400 }
      );
    }

    const clubId = params.id;
    const newStatus = action === "approve" ? "approved" : "suspended";
    const now = new Date().toISOString();

    // Update club status
    const result = await runQuery<{
      clubId: string;
      name: string;
      status: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})
      SET c.status = $newStatus,
          c.updatedAt = $now,
          c.updated_at = $now
      RETURN c.clubId AS clubId, coalesce(c.name, c.clubName, "") AS name, c.status AS status
      `,
      { clubId, newStatus, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Club not found" },
        { status: 404 }
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
