import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

async function saveImageFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), "public", "uploads", "posts");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  return `/uploads/posts/${filename}`;
}

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

    // Check if user is advisor or member of the club
    const userCheck = await runQuery<{
      isAdvisor: boolean;
      isMember: boolean;
    }>(
      `
      MATCH (u:User {userId: $userId})
      OPTIONAL MATCH (u)-[:ADVISES]->(c1:Club {clubId: $clubId})
      OPTIONAL MATCH (u)-[:MEMBER_OF_CLUB]->(c2:Club {clubId: $clubId})
      RETURN 
        COUNT(c1) > 0 AS isAdvisor,
        COUNT(c2) > 0 AS isMember
      `,
      { userId: session.userId, clubId }
    );

    const check = userCheck[0];
    if (!check?.isAdvisor && !check?.isMember) {
      return NextResponse.json(
        { ok: false, error: "You are not an advisor or member of this club" },
        { status: 403 }
      );
    }

    const isAdvisor = check?.isAdvisor || false;

    // Handle FormData
    const formData = await req.formData();
    const type = formData.get("type")?.toString();
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const visibility = formData.get("visibility")?.toString() || "institution";
    const imageFile = formData.get("image") as File | null;
    const date = formData.get("date")?.toString();
    const endDate = formData.get("endDate")?.toString();
    const venue = formData.get("venue")?.toString();
    const link = formData.get("link")?.toString();
    const maxSlots = formData.get("maxSlots")?.toString();
    const tags = formData.get("tags")?.toString() || "";
    const removeImage = formData.get("removeImage")?.toString() === "true";

    if (type !== "event" && type !== "announcement") {
      return NextResponse.json(
        { ok: false, error: "Invalid post type" },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!description.trim()) {
      return NextResponse.json(
        { ok: false, error: "Description is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Determine status: approved if advisor, pending if member
    const postStatus = isAdvisor ? "approved" : "pending";

    // Handle image
    let imageUrl: string | null | undefined = undefined;
    if (removeImage) {
      imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await saveImageFile(imageFile);
      } catch (err) {
        console.error("Error saving image:", err);
        return NextResponse.json(
          { ok: false, error: "Failed to save image file" },
          { status: 500 }
        );
      }
    }

    if (type === "event") {
      if (!date) {
        return NextResponse.json(
          { ok: false, error: "Start date is required for events" },
          { status: 400 }
        );
      }

      if (!venue) {
        return NextResponse.json(
          { ok: false, error: "Venue is required for events" },
          { status: 400 }
        );
      }

      if (!tags.trim()) {
        return NextResponse.json(
          { ok: false, error: "Tags are required for events" },
          { status: 400 }
        );
      }

      // Parse tags
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Update event
      const updateClause: string[] = [
        "e.title = $title",
        "e.description = $description",
        "e.startAt = $startAt",
        "e.endAt = $endDate",
        "e.venue = $venue",
        "e.link = $link",
        "e.maxSlots = $maxSlots",
        "e.visibility = $visibility",
        "e.status = $status",
        "e.updatedAt = $now",
      ];

      if (imageUrl !== undefined) {
        updateClause.push("e.imageUrl = $imageUrl");
      }

      const updateQuery = `
        MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
        SET ${updateClause.join(", ")}
        WITH e
        OPTIONAL MATCH (e)-[ht:HAS_TAG]->(:Tag)
        DELETE ht
        WITH e
        ${tagArray.length > 0 ? `UNWIND $tagArray AS tag MERGE (t:Tag {name: tag}) CREATE (e)-[:HAS_TAG]->(t)` : ""}
        RETURN e.eventId AS id, e.title AS title, e.status AS status
      `;

      const params: Record<string, unknown> = {
        clubId,
        postId,
        title: title.trim(),
        description: description.trim(),
        startAt: date,
        endDate: endDate || null,
        venue: venue.trim(),
        link: link?.trim() || null,
        maxSlots: maxSlots ? parseInt(maxSlots, 10) : null,
        visibility,
        status: postStatus,
        now,
        tagArray,
      };

      if (imageUrl !== undefined) {
        params.imageUrl = imageUrl;
      }

      const result = await runQuery<{
        id: string;
        title: string;
        status: string;
      }>(updateQuery, params);

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Event not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Event updated successfully",
        post: {
          id: result[0].id,
          title: result[0].title,
          status: result[0].status,
        },
      });
    } else {
      // Update announcement
      const updateClause: string[] = [
        "a.title = $title",
        "a.content = $description",
        "a.visibility = $visibility",
        "a.status = $status",
        "a.updatedAt = $now",
      ];

      if (imageUrl !== undefined) {
        updateClause.push("a.imageUrl = $imageUrl");
      }

      const updateQuery = `
        MATCH (a:Announcement {announcementId: $postId})-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
        SET ${updateClause.join(", ")}
        RETURN a.announcementId AS id, a.title AS title, a.status AS status
      `;

      const params: Record<string, unknown> = {
        clubId,
        postId,
        title: title.trim(),
        description: description.trim(),
        visibility,
        status: postStatus,
        now,
      };

      if (imageUrl !== undefined) {
        params.imageUrl = imageUrl;
      }

      const result = await runQuery<{
        id: string;
        title: string;
        status: string;
      }>(updateQuery, params);

      if (!result.length) {
        return NextResponse.json(
          { ok: false, error: "Announcement not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Announcement updated successfully",
        post: {
          id: result[0].id,
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

async function deleteImageFile(imageUrl: string): Promise<void> {
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
}

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

    if (session.role !== "employee" && session.role !== "staff") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId, postId } = await params;

    // Verify user is advisor or president
    const userCheck = await runQuery<{
      isAdvisor: boolean;
      isPresident: boolean;
      postType: "event" | "announcement" | null;
      imageUrl?: string;
    }>(
      `
      MATCH (u:User {userId: $userId})
      OPTIONAL MATCH (u)-[:ADVISES]->(c1:Club {clubId: $clubId})
      OPTIONAL MATCH (u)-[:MEMBER_OF_CLUB {role: "officer"}]->(c2:Club {clubId: $clubId})
      OPTIONAL MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
      OPTIONAL MATCH (c:Club {clubId: $clubId})<-[:BELONGS_TO_CLUB]-(a:Announcement {announcementId: $postId})
      RETURN 
        COUNT(c1) > 0 AS isAdvisor,
        COUNT(c2) > 0 AS isPresident,
        CASE WHEN e IS NOT NULL THEN "event" WHEN a IS NOT NULL THEN "announcement" ELSE NULL END AS postType,
        COALESCE(e.imageUrl, a.imageUrl) AS imageUrl
      `,
      { userId: session.userId, clubId, postId }
    );

    const check = userCheck[0];
    if (!check?.isAdvisor && !check?.isPresident) {
      return NextResponse.json(
        { ok: false, error: "You are not authorized to delete this post" },
        { status: 403 }
      );
    }

    if (!check.postType) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Delete image file if exists
    if (check.imageUrl) {
      await deleteImageFile(check.imageUrl);
    }

    // Delete the post
    if (check.postType === "event") {
      await runQuery(
        `
        MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event {eventId: $postId})
        OPTIONAL MATCH (e)-[r:HAS_TAG]->(t:Tag)
        DELETE r
        DETACH DELETE e
        `,
        { clubId, postId }
      );
    } else {
      await runQuery(
        `
        MATCH (a:Announcement {announcementId: $postId})-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
        DETACH DELETE a
        `,
        { clubId, postId }
      );
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

