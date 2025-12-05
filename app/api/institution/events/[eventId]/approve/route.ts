import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

/**
 * PATCH /api/institution/events/[eventId]/approve
 * Approve or reject event
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
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

    const { eventId } = await params;
    const institutionId = session.institutionId || session.userId;

    const body = await req.json();
    const { action, reason } = body; // action: "approve" | "reject"

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify event exists and belongs to institution
    const eventCheck = await runQuery<{
      exists: boolean;
      status: string;
    }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      OPTIONAL MATCH (e1:Event {eventId: $eventId})-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event {eventId: $eventId})
      WITH coalesce(e1, e2) AS e
      WHERE e IS NOT NULL
      RETURN COUNT(e) > 0 AS exists, e.status AS status
      LIMIT 1
      `,
      { eventId, institutionId }
    );

    if (!eventCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Only pending events can be approved/rejected
    if (eventCheck[0]?.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Only pending events can be approved or rejected" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "published" : "rejected";
    const now = new Date().toISOString();

    // Update event status
    const result = await runQuery<{
      eventId: string;
      title: string;
      status: string;
    }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      OPTIONAL MATCH (e1:Event {eventId: $eventId})-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event {eventId: $eventId})
      WITH coalesce(e1, e2) AS e
      WHERE e IS NOT NULL AND e.status = "pending"
      SET e.status = $newStatus, e.updatedAt = $now
      RETURN e.eventId AS eventId, e.title AS title, e.status AS status
      `,
      { eventId, institutionId, newStatus, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Event not found or not pending" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Event ${action}d successfully`,
      event: {
        id: result[0].eventId,
        title: result[0].title,
        status: result[0].status,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error approving/rejecting event:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

