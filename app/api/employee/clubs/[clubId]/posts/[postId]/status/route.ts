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
    const { type, status } = body; // type: "event" | "announcement", status: "published" | "hidden"

    if (type !== "event" && type !== "announcement") {
      return NextResponse.json(
        { ok: false, error: "Invalid post type" },
        { status: 400 }
      );
    }

    if (status !== "published" && status !== "hidden") {
      return NextResponse.json(
        { ok: false, error: "Invalid status. Must be 'published' or 'hidden'" },
        { status: 400 }
      );
    }

    // Check if user is advisor or president (officer) of the club
    const userCheck = await runQuery<{
      isAdvisor: boolean;
      isPresident: boolean;
    }>(
      `
      MATCH (u:User {userId: $userId})
      OPTIONAL MATCH (u)-[:ADVISES]->(c1:Club {clubId: $clubId})
      OPTIONAL MATCH (u)-[mc:MEMBER_OF_CLUB {role: "officer"}]->(c2:Club {clubId: $clubId})
      RETURN 
        COUNT(c1) > 0 AS isAdvisor,
        COUNT(c2) > 0 AS isPresident
      `,
      { userId: session.userId, clubId }
    );

    const check = userCheck[0];
    if (!check?.isAdvisor && !check?.isPresident) {
      return NextResponse.json(
        { ok: false, error: "Only advisor or president can change post status" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    if (type === "event") {
      const result = await runQuery<{
        eventId: string;
        title: string;
        status: string;
      }>(
        `
        MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
        SET e.status = $status,
            e.updatedAt = $now
        RETURN e.eventId AS eventId, e.title AS title, e.status AS status
        `,
        { clubId, postId, status, now }
      );

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Event not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Event status updated successfully`,
        post: {
          id: result[0].eventId,
          title: result[0].title,
          status: result[0].status,
        },
      });
    } else {
      const result = await runQuery<{
        announcementId: string;
        title: string;
        status: string;
      }>(
        `
        MATCH (a:Announcement {announcementId: $postId})-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
        SET a.status = $status,
            a.updatedAt = $now
        RETURN a.announcementId AS announcementId, a.title AS title, a.status AS status
        `,
        { clubId, postId, status, now }
      );

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Announcement not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Announcement status updated successfully`,
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

