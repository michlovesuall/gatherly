import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export async function DELETE(
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

    if (session.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId, postId } = await params;

    // Verify user is president (officer) of the club
    const presidentCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (u:User {userId: $userId})-[mc:MEMBER_OF_CLUB {role: "officer"}]->(c:Club {clubId: $clubId})
      RETURN COUNT(mc) > 0 AS exists
      `,
      { userId: session.userId, clubId }
    );

    if (!presidentCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "You are not a president of this club" },
        { status: 403 }
      );
    }

    // Check if post exists and get its type and image
    const postCheck = await runQuery<{
      type: string;
      imageUrl?: string;
    }>(
      `
      OPTIONAL MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
      OPTIONAL MATCH (a:Announcement {announcementId: $postId})-[:BELONGS_TO_CLUB]->(c2:Club {clubId: $clubId})
      RETURN 
        CASE 
          WHEN e IS NOT NULL THEN "event"
          WHEN a IS NOT NULL THEN "announcement"
          ELSE null
        END AS type,
        coalesce(e.imageUrl, a.imageUrl) AS imageUrl
      `,
      { clubId, postId }
    );

    if (!postCheck[0]?.type) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      );
    }

    const postType = postCheck[0].type;
    const imageUrl = postCheck[0].imageUrl;

    // Delete the post
    if (postType === "event") {
      const result = await runQuery<{ eventId: string }>(
        `
        MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
        DETACH DELETE e
        RETURN e.eventId AS eventId
        `,
        { clubId, postId }
      );

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Event not found" },
          { status: 404 }
        );
      }
    } else {
      const result = await runQuery<{ announcementId: string }>(
        `
        MATCH (a:Announcement {announcementId: $postId})-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
        DETACH DELETE a
        RETURN a.announcementId AS announcementId
        `,
        { clubId, postId }
      );

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Announcement not found" },
          { status: 404 }
        );
      }
    }

    // Delete image file if exists
    if (imageUrl && imageUrl.startsWith("/uploads/posts/")) {
      const filepath = join(process.cwd(), "public", imageUrl);
      if (existsSync(filepath)) {
        try {
          await unlink(filepath);
        } catch (e) {
          console.error("Failed to delete image file:", e);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Post deleted successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

