import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { ClubPost } from "@/lib/repos/employee";

async function saveImageFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), "public", "uploads", "posts");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  // Return public URL
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

    if (session.role !== "employee" && session.role !== "staff") {
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

    const posts: ClubPost[] = [
      ...events.map((e) => ({
        id: e.id,
        type: "event" as const,
        title: e.title,
        content: e.content,
        createdAt: e.createdAt,
        authorId: e.authorId,
        authorName: e.authorName,
        authorType: (e.authorType === "advisor" ? "advisor" : "member") as const,
        status: (e.status === "published"
          ? "published"
          : e.status === "pending"
          ? "pending"
          : e.status === "approved"
          ? "approved"
          : e.status === "hidden"
          ? "hidden"
          : "draft") as const,
        visibility: e.visibility as "institution" | "public" | "restricted" | undefined,
        imageUrl: e.imageUrl || undefined,
        startAt: e.startAt,
        endAt: e.endAt,
        venue: e.venue,
        link: e.link || undefined,
        maxSlots: e.maxSlots || undefined,
        tags: e.tags && e.tags.length > 0 ? e.tags : undefined,
        posterId: e.posterId || e.authorId,
        posterName: e.posterName || e.authorName,
      })),
      ...announcements.map((a) => ({
        id: a.id,
        type: "announcement" as const,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt,
        authorId: a.authorId,
        authorName: a.authorName,
        authorType: (a.authorType === "advisor" ? "advisor" : "member") as const,
        status: (a.status === "published"
          ? "published"
          : a.status === "pending"
          ? "pending"
          : a.status === "approved"
          ? "approved"
          : a.status === "hidden"
          ? "hidden"
          : "draft") as const,
        visibility: a.visibility as "institution" | "public" | "restricted" | undefined,
        imageUrl: a.imageUrl || undefined,
        date: a.date || undefined,
        posterId: a.posterId || a.authorId,
        posterName: a.posterName || a.authorName,
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    });

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

    if (session.role !== "employee" && session.role !== "staff") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId } = await params;

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

    // Determine status: approved if advisor, pending if member
    const isAdvisor = check?.isAdvisor || false;
    const postStatus = isAdvisor ? "approved" : "pending";

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
    const tags = formData.get("tags")?.toString() || "";

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

    // Date is only required for events
    if (type === "event" && !date) {
      return NextResponse.json(
        { ok: false, error: "Date is required for events" },
        { status: 400 }
      );
    }

    // Save image file if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
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

    const now = new Date().toISOString();
    const postId = randomUUID();

    // Get user name for poster
    const userInfo = await runQuery<{ name: string }>(
      `MATCH (u:User {userId: $userId}) RETURN u.name AS name`,
      { userId: session.userId }
    );
    const posterName = userInfo[0]?.name || session.userId;

    if (type === "event") {
      // Create event
      if (!venue) {
        return NextResponse.json(
          { ok: false, error: "Venue is required for events" },
          { status: 400 }
        );
      }

      const startAt = new Date(date).toISOString();
      const endAt = formData.get("endDate")?.toString()
        ? new Date(formData.get("endDate")!.toString()).toISOString()
        : startAt;

      // Parse tags (comma-separated)
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Build query with conditional tag creation
      const tagQuery = tagArray.length > 0
        ? `
        WITH e, $tagArray AS tagArray
        UNWIND tagArray AS tag
        MERGE (t:Tag {name: tag})
        CREATE (e)-[:HAS_TAG]->(t)
        `
        : "";

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
          status: $status,
          posterId: $posterId,
          posterName: $posterName,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        CREATE (c)-[:HOSTS]->(e)
        CREATE (c)-[:CREATED]->(e)
        ${tagQuery}
        RETURN e.eventId AS eventId, e.title AS title
        `,
        {
          clubId,
          eventId: postId,
          title: title.trim(),
          description: description.trim(),
          startAt,
          endAt,
          venue: venue.trim(),
          link: link?.trim() || null,
          maxSlots: maxSlots ? parseInt(maxSlots, 10) : null,
          visibility,
          imageUrl,
          status: postStatus,
          posterId: session.userId,
          posterName,
          createdAt: now,
          updatedAt: now,
          tagArray: tagArray.length > 0 ? tagArray : [],
        }
      );

      return NextResponse.json({
        ok: true,
        message: "Event created successfully",
        post: {
          id: result[0]?.eventId,
          title: result[0]?.title,
        },
      });
    } else {
      // Create announcement - use current timestamp for date
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
          status: $status,
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
          status: postStatus,
          posterId: session.userId,
          posterName,
          createdAt: now,
          updatedAt: now,
        }
      );

      return NextResponse.json({
        ok: true,
        message: "Announcement created successfully",
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
