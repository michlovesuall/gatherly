import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import {
  getInstitutionEvents,
  getInstitutionEventStats,
  getInstitutionClubsForDropdown,
} from "@/lib/repos/institution";

async function saveImageFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), "public", "uploads", "events");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  // Return public URL
  return `/uploads/events/${filename}`;
}

/**
 * GET /api/institution/events
 * Get all events for the institution with filters
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

    if (session.role !== "institution") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const institutionId = session.institutionId || session.userId;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") ||
      "createdAt") as "createdAt" | "startAt" | "status";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const result = await getInstitutionEvents(institutionId, {
      status,
      search,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });

    return NextResponse.json({
      ok: true,
      events: result.events,
      total: result.total,
      page,
      pageSize,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error fetching events:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/institution/events
 * Create a new event (directly by institution or assign to a club)
 */
export async function POST(req: Request) {
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

    const institutionId = session.institutionId || session.userId;

    // Verify institution exists and is approved
    const instCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(i.status, "") = "approved"
      RETURN COUNT(i) > 0 AS exists
      `,
      { institutionId }
    );

    if (!instCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Institution not found or not approved" },
        { status: 404 }
      );
    }

    // Handle FormData
    const formData = await req.formData();
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const startAt = formData.get("startAt")?.toString() || "";
    const endAt = formData.get("endAt")?.toString() || null;
    const venue = formData.get("venue")?.toString() || "";
    const link = formData.get("link")?.toString() || null;
    const maxSlots = formData.get("maxSlots")?.toString() || null;
    const visibility = (formData.get("visibility")?.toString() ||
      "institution") as "public" | "institution" | "restricted";
    const status = (formData.get("status")?.toString() ||
      "published") as "draft" | "pending" | "published" | "approved";
    const tags = formData.get("tags")?.toString() || "";
    const clubId = formData.get("clubId")?.toString() || null;
    const imageFile = formData.get("image") as File | null;

    // Validation
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

    if (!startAt) {
      return NextResponse.json(
        { ok: false, error: "Start date is required" },
        { status: 400 }
      );
    }

    if (!venue.trim()) {
      return NextResponse.json(
        { ok: false, error: "Venue is required" },
        { status: 400 }
      );
    }

    // Validate end date is after start date
    if (endAt && new Date(endAt) < new Date(startAt)) {
      return NextResponse.json(
        { ok: false, error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Validate URL format if link is provided
    if (link && link.trim()) {
      try {
        new URL(link);
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid URL format for link" },
          { status: 400 }
        );
      }
    }

    // Verify club exists and belongs to institution if clubId is provided
    if (clubId) {
      const clubCheck = await runQuery<{ exists: boolean }>(
        `
        MATCH (c:Club {clubId: $clubId})-[:BELONGS_TO]->(i)
        WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
          AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
          AND coalesce(c.status, "pending") = "approved"
        RETURN COUNT(c) > 0 AS exists
        `,
        { clubId, institutionId }
      );

      if (!clubCheck[0]?.exists) {
        return NextResponse.json(
          { ok: false, error: "Club not found or not approved" },
          { status: 404 }
        );
      }
    }

    // Save image if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          { ok: false, error: "Invalid image type. Only JPEG, PNG, and WebP are allowed." },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return NextResponse.json(
          { ok: false, error: "Image size must be less than 5MB" },
          { status: 400 }
        );
      }

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

    const eventId = randomUUID();
    const now = new Date().toISOString();

    // Get user name
    const userResult = await runQuery<{ name: string }>(
      `MATCH (u:User {userId: $userId}) RETURN coalesce(u.name, "") AS name`,
      { userId: session.userId }
    );
    const posterName = userResult[0]?.name || "Institution Admin";

    // Parse tags
    const tagArray = tags
      ? tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    // Create event
    if (clubId) {
      // Create event for a club
      const result = await runQuery<{
        eventId: string;
        title: string;
      }>(
        `
        MATCH (c:Club {clubId: $clubId})
        MATCH (i)
        WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
          AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
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
        ${tagArray.length > 0 ? `
        WITH e
        UNWIND $tagArray AS tagName
        MERGE (t:Tag {name: tagName})
        CREATE (e)-[:HAS_TAG]->(t)
        WITH e
        ` : ""}
        RETURN e.eventId AS eventId, e.title AS title
        `,
        {
          clubId,
          institutionId,
          eventId,
          title: title.trim(),
          description: description.trim(),
          startAt,
          endAt: endAt || null,
          venue: venue.trim(),
          link: link?.trim() || null,
          maxSlots: maxSlots ? parseInt(maxSlots, 10) : null,
          visibility,
          imageUrl,
          status,
          posterId: session.userId,
          posterName,
          createdAt: now,
          updatedAt: now,
          tagArray,
        }
      );

      return NextResponse.json(
        {
          ok: true,
          message: "Event created successfully",
          event: {
            id: result[0]?.eventId,
            title: result[0]?.title,
          },
        },
        { status: 201 }
      );
    } else {
      // Create event directly for institution
      const result = await runQuery<{
        eventId: string;
        title: string;
      }>(
        `
        MATCH (i)
        WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
          AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
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
        CREATE (e)-[:BELONGS_TO]->(i)
        ${tagArray.length > 0 ? `
        WITH e
        UNWIND $tagArray AS tagName
        MERGE (t:Tag {name: tagName})
        CREATE (e)-[:HAS_TAG]->(t)
        WITH e
        ` : ""}
        RETURN e.eventId AS eventId, e.title AS title
        `,
        {
          institutionId,
          eventId,
          title: title.trim(),
          description: description.trim(),
          startAt,
          endAt: endAt || null,
          venue: venue.trim(),
          link: link?.trim() || null,
          maxSlots: maxSlots ? parseInt(maxSlots, 10) : null,
          visibility,
          imageUrl,
          status,
          posterId: session.userId,
          posterName,
          createdAt: now,
          updatedAt: now,
          tagArray,
        }
      );

      return NextResponse.json(
        {
          ok: true,
          message: "Event created successfully",
          event: {
            id: result[0]?.eventId,
            title: result[0]?.title,
          },
        },
        { status: 201 }
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error creating event:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

