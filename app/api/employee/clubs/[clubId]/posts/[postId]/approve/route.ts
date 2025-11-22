import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string; postId: string }> }
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

    const { clubId, postId } = await params;
    const body = await req.json();
    const { type, action } = body; // type: "event" | "announcement", action: "approve" | "reject"

    if (type !== "event" && type !== "announcement") {
      return NextResponse.json(
        { ok: false, error: "Invalid post type" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'approve' or 'reject'" },
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

    const newStatus = action === "approve" ? "published" : "rejected";
    const now = new Date().toISOString();

    if (type === "event") {
      // Update event status
      const result = await runQuery<{
        eventId: string;
        title: string;
        status: string;
      }>(
        `
        MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
        SET e.status = $newStatus,
            e.updatedAt = $now
        RETURN e.eventId AS eventId, e.title AS title, e.status AS status
        `,
        { clubId, postId, newStatus, now }
      );

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Event not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Event ${action}d successfully`,
        post: {
          id: result[0].eventId,
          title: result[0].title,
          status: result[0].status,
        },
      });
    } else {
      // Update announcement status
      const result = await runQuery<{
        announcementId: string;
        title: string;
        status: string;
      }>(
        `
        MATCH (a:Announcement {announcementId: $postId})-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
        SET a.status = $newStatus,
            a.updatedAt = $now
        RETURN a.announcementId AS announcementId, a.title AS title, a.status AS status
        `,
        { clubId, postId, newStatus, now }
      );

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Announcement not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Announcement ${action}d successfully`,
        post: {
          id: result[0].announcementId,
          title: result[0].title,
          status: result[0].status,
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

