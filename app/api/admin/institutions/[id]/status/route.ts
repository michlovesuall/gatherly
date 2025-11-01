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

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const institutionId = params.id;
    const newStatus = action === "approve" ? "approved" : "rejected";
    const now = new Date().toISOString();

    // Update institution status
    const result = await runQuery<{
      userId: string;
      name: string;
      status: string;
    }>(
      `
      MATCH (i:User {userId: $institutionId, platformRole: "institution"})
      SET i.status = $newStatus,
          i.updatedAt = $now
      RETURN i.userId AS userId, i.name AS name, i.status AS status
      `,
      { institutionId, newStatus, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Institution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      institution: {
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

