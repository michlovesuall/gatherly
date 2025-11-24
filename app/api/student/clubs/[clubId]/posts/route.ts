import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import type { ClubPost } from "@/lib/repos/employee";

async function saveImageFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${randomUUID()}-${file.name}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "posts");
  
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/posts/${filename}`;
}

// GET endpoint to fetch posts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
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

    const { clubId } = await params;

    // Get events
    const events = await runQuery<{
      id: string;
      title: string;
      content?: string;
      createdAt: string;
      authorId: string;
      authorName: string;
      authorType: string;
      status: string;
      startAt?: string;
      endAt?: string;
      venue?: string;
      visibility?: string;
      imageUrl?: string;
      link?: string;
      maxSlots?: number;
      tags?: string[];
      posterId?: string;
      posterName?: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})-[:HOSTS]->(e:Event)
      OPTIONAL MATCH (e)<-[:CREATED]-(creator:User)
      OPTIONAL MATCH (advisor:User)-[:ADVISES]->(c)
      OPTIONAL MATCH (e)-[:HAS_TAG]->(tag:Tag)
      WITH e, creator, advisor, collect(DISTINCT tag.name) AS tagList
      WITH e, creator, advisor, tagList,
        CASE 
          WHEN advisor.userId = creator.userId THEN "advisor"
          ELSE "member"
        END AS authorType
      RETURN 
        e.eventId AS id,
        e.title AS title,
        e.description AS content,
        e.createdAt AS createdAt,
        coalesce(e.posterId, creator.userId, "") AS authorId,
        coalesce(e.posterName, creator.name, "") AS authorName,
        authorType,
        coalesce(e.status, "draft") AS status,
        e.startAt AS startAt,
        e.endAt AS endAt,
        e.venue AS venue,
        coalesce(e.visibility, "institution") AS visibility,
        e.imageUrl AS imageUrl,
        e.link AS link,
        e.maxSlots AS maxSlots,
        tagList AS tags,
        e.posterId AS posterId,
        e.posterName AS posterName
      ORDER BY e.createdAt DESC
      `,
      { clubId }
    );

    // Get announcements
    const announcements = await runQuery<{
      id: string;
      title: string;
      content?: string;
      createdAt: string;
      authorId: string;
      authorName: string;
      authorType: string;
      status: string;
      visibility?: string;
      imageUrl?: string;
      date?: string;
      posterId?: string;
      posterName?: string;
    }>(
      `
      MATCH (a:Announcement)-[:BELONGS_TO_CLUB]->(c:Club {clubId: $clubId})
      OPTIONAL MATCH (a)<-[:CREATED]-(creator:User)
      OPTIONAL MATCH (advisor:User)-[:ADVISES]->(c)
      WITH a, creator, advisor,
        CASE 
          WHEN advisor.userId = creator.userId THEN "advisor"
          ELSE "member"
        END AS authorType
      RETURN 
        a.announcementId AS id,
        a.title AS title,
        a.content AS content,
        a.createdAt AS createdAt,
        coalesce(a.posterId, creator.userId, "") AS authorId,
        coalesce(a.posterName, creator.name, "") AS authorName,
        authorType,
        coalesce(a.status, "draft") AS status,
        coalesce(a.visibility, "institution") AS visibility,
        a.imageUrl AS imageUrl,
        a.date AS date,
        a.posterId AS posterId,
        a.posterName AS posterName
      ORDER BY a.createdAt DESC
      `,
      { clubId }
    );

    const posts = [
      ...events.map((e) => ({
        id: e.id,
        type: "event" as const,
        title: e.title,
        content: e.content,
        createdAt: e.createdAt,
        authorId: e.authorId,
        authorName: e.authorName,
        authorType: e.authorType,
        status: e.status,
        startAt: e.startAt,
        endAt: e.endAt,
        venue: e.venue,
        visibility: e.visibility,
        imageUrl: e.imageUrl,
        link: e.link,
        maxSlots: e.maxSlots,
        tags: e.tags,
      })),
      ...announcements.map((a) => ({
        id: a.id,
        type: "announcement" as const,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt,
        authorId: a.authorId,
        authorName: a.authorName,
        authorType: a.authorType,
        status: a.status,
        visibility: a.visibility,
        imageUrl: a.imageUrl,
        date: a.date,
      })),
    ];

    return NextResponse.json({ ok: true, posts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
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

    const { clubId } = await params;

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
        { ok: false, error: "Only president can create posts" },
        { status: 403 }
      );
    }

    // Handle FormData
    const formData = await req.formData();
    const type = formData.get("type")?.toString();
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const visibility = formData.get("visibility")?.toString() || "institution";
    const imageFile = formData.get("image") as File | null;
    const date = formData.get("date")?.toString();
    const venue = formData.get("venue")?.toString();
    const link = formData.get("link")?.toString();
    const maxSlots = formData.get("maxSlots")?.toString();
    const tags = formData.get("tags")?.toString();

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

    // Save image if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await saveImageFile(imageFile);
      } catch (error) {
        console.error("Error saving image:", error);
        return NextResponse.json(
          { ok: false, error: "Failed to save image" },
          { status: 500 }
        );
      }
    }

    const postId = randomUUID();
    const now = new Date().toISOString();

    // Get user name
    const userResult = await runQuery<{ name: string }>(
      `MATCH (u:User {userId: $userId}) RETURN u.name AS name`,
      { userId: session.userId }
    );
    const posterName = userResult[0]?.name || "Unknown";

    if (type === "event") {
      if (!date) {
        return NextResponse.json(
          { ok: false, error: "Start date is required for events" },
          { status: 400 }
        );
      }

      if (!venue?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Venue is required for events" },
          { status: 400 }
        );
      }

      const tagArray = tags
        ? tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
        : [];

      if (tagArray.length === 0) {
        return NextResponse.json(
          { ok: false, error: "At least one tag is required for events" },
          { status: 400 }
        );
      }

      const endDate = formData.get("endDate")?.toString() || date;

      // Create event
      const result = await runQuery<{
        eventId: string;
        title: string;
      }>(
        `
        MATCH (c:Club {clubId: $clubId})
        CREATE (e:Event {
          eventId: $eventId,
          title: $title,
          description: $description,
          startAt: $startAt,
          endAt: $endAt,
          venue: $venue,
          link: $link,
          maxSlots: $maxSlots,
          visibility: $visibility,
          imageUrl: $imageUrl,
          status: "pending",
          posterId: $posterId,
          posterName: $posterName,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        CREATE (c)-[:HOSTS]->(e)
        CREATE (c)-[:CREATED]->(e)
        WITH e
        UNWIND $tagArray AS tagName
        MERGE (t:Tag {name: tagName})
        CREATE (e)-[:HAS_TAG]->(t)
        RETURN e.eventId AS eventId, e.title AS title
        `,
        {
          clubId,
          eventId: postId,
          title: title.trim(),
          description: description.trim(),
          startAt: date,
          endAt: endDate,
          venue: venue.trim(),
          link: link?.trim() || null,
          maxSlots: maxSlots ? parseInt(maxSlots, 10) : null,
          visibility,
          imageUrl,
          posterId: session.userId,
          posterName,
          createdAt: now,
          updatedAt: now,
          tagArray,
        }
      );

      return NextResponse.json({
        ok: true,
        message: "Event created successfully. It will be pending until approved.",
        post: {
          id: result[0]?.eventId,
          title: result[0]?.title,
        },
      });
    } else {
      // Create announcement
      const result = await runQuery<{
        announcementId: string;
        title: string;
      }>(
        `
        MATCH (c:Club {clubId: $clubId})
        CREATE (a:Announcement {
          announcementId: $announcementId,
          title: $title,
          content: $description,
          date: $createdAt,
          visibility: $visibility,
          imageUrl: $imageUrl,
          status: "pending",
          posterId: $posterId,
          posterName: $posterName,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        CREATE (a)-[:BELONGS_TO_CLUB]->(c)
        CREATE (c)-[:CREATED]->(a)
        RETURN a.announcementId AS announcementId, a.title AS title
        `,
        {
          clubId,
          announcementId: postId,
          title: title.trim(),
          description: description.trim(),
          visibility,
          imageUrl,
          posterId: session.userId,
          posterName,
          createdAt: now,
          updatedAt: now,
        }
      );

      return NextResponse.json({
        ok: true,
        message: "Announcement created successfully. It will be pending until approved.",
        post: {
          id: result[0]?.announcementId,
          title: result[0]?.title,
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

