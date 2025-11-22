import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getNewsfeedItems } from "@/lib/repos/student";

/**
 * GET /api/newsfeed
 * Get newsfeed items with filtering
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const filter = (url.searchParams.get("filter") || "for-you") as "for-you" | "global";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const items = await getNewsfeedItems(
      session.userId,
      session.institutionId,
      filter,
      limit
    );

    return NextResponse.json({ ok: true, items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

