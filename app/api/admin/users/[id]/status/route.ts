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

    const { status } = await req.json();

    if (status !== "active" && status !== "disabled") {
      return NextResponse.json(
        { ok: false, error: "Invalid status. Must be 'active' or 'disabled'" },
        { status: 400 }
      );
    }

    const userId = params.id;
    const now = new Date().toISOString();

    // Update user status
    const result = await runQuery<{
      userId: string;
      name: string;
      status: string;
    }>(
      `
      MATCH (u:User {userId: $userId})
      WHERE u.platformRole IS NULL OR u.platformRole IN ["student", "employee"]
      SET u.status = $status,
          u.updatedAt = $now
      RETURN u.userId AS userId, u.name AS name, u.status AS status
      `,
      { userId, status, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
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

