import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { getInstitutionEventDetails } from "@/lib/repos/institution";

async function saveImageFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), "public", "uploads", "events");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  return `/uploads/events/${filename}`;
}

async function deleteImageFile(imageUrl: string): Promise<void> {
  if (imageUrl && imageUrl.startsWith("/uploads/events/")) {
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

/**
 * GET /api/institution/events/[eventId]
 * Get single event details
 */
export async function GET(
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

    const event = await getInstitutionEventDetails(eventId, institutionId);

    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      event,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error fetching event:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/institution/events/[eventId]
 * Update event
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

    // Verify event exists and belongs to institution
    const eventCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      OPTIONAL MATCH (e1:Event {eventId: $eventId})-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event {eventId: $eventId})
      WITH coalesce(e1, e2) AS e
      WHERE e IS NOT NULL
      RETURN COUNT(e) > 0 AS exists
      `,
      { eventId, institutionId }
    );

    if (!eventCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Handle FormData
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString();
    const startAt = formData.get("startAt")?.toString();
    const endAt = formData.get("endAt")?.toString();
    const venue = formData.get("venue")?.toString();
    const link = formData.get("link")?.toString();
    const maxSlots = formData.get("maxSlots")?.toString();
    const visibility = formData.get("visibility")?.toString();
    const status = formData.get("status")?.toString();
    const tags = formData.get("tags")?.toString();
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage")?.toString() === "true";

    const now = new Date().toISOString();

    // Build update clause
    const updateClause: string[] = ["e.updatedAt = $now"];
    const params: Record<string, unknown> = {
      eventId,
      institutionId,
      now,
    };

    if (title !== null) {
      if (!title.trim()) {
        return NextResponse.json(
          { ok: false, error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updateClause.push("e.title = $title");
      params.title = title.trim();
    }

    if (description !== null) {
      if (!description.trim()) {
        return NextResponse.json(
          { ok: false, error: "Description cannot be empty" },
          { status: 400 }
        );
      }
      updateClause.push("e.description = $description");
      params.description = description.trim();
    }

    if (startAt) {
      updateClause.push("e.startAt = $startAt");
      params.startAt = startAt;
    }

    if (endAt !== null) {
      // Validate end date is after start date
      if (startAt && new Date(endAt) < new Date(startAt)) {
        return NextResponse.json(
          { ok: false, error: "End date must be after start date" },
          { status: 400 }
        );
      }
      updateClause.push("e.endAt = $endAt");
      params.endAt = endAt || null;
    }

    if (venue !== null) {
      if (!venue.trim()) {
        return NextResponse.json(
          { ok: false, error: "Venue cannot be empty" },
          { status: 400 }
        );
      }
      updateClause.push("e.venue = $venue");
      params.venue = venue.trim();
    }

    if (link !== null) {
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
      updateClause.push("e.link = $link");
      params.link = link?.trim() || null;
    }

    if (maxSlots !== null) {
      updateClause.push("e.maxSlots = $maxSlots");
      params.maxSlots = maxSlots ? parseInt(maxSlots, 10) : null;
    }

    if (visibility) {
      if (!["public", "institution", "restricted"].includes(visibility)) {
        return NextResponse.json(
          { ok: false, error: "Invalid visibility value" },
          { status: 400 }
        );
      }
      updateClause.push("e.visibility = $visibility");
      params.visibility = visibility;
    }

    if (status) {
      if (
        !["draft", "pending", "published", "approved", "rejected", "hidden"].includes(
          status
        )
      ) {
        return NextResponse.json(
          { ok: false, error: "Invalid status value" },
          { status: 400 }
        );
      }
      updateClause.push("e.status = $status");
      params.status = status;
    }

    // Handle image
    let imageUrl: string | null | undefined = undefined;
    if (removeImage) {
      // Get current image URL to delete it
      const currentEvent = await getInstitutionEventDetails(eventId, institutionId);
      if (currentEvent?.imageUrl) {
        await deleteImageFile(currentEvent.imageUrl);
      }
      imageUrl = null;
      updateClause.push("e.imageUrl = $imageUrl");
      params.imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
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
        // Delete old image if exists
        const currentEvent = await getInstitutionEventDetails(eventId, institutionId);
        if (currentEvent?.imageUrl) {
          await deleteImageFile(currentEvent.imageUrl);
        }

        imageUrl = await saveImageFile(imageFile);
        updateClause.push("e.imageUrl = $imageUrl");
        params.imageUrl = imageUrl;
      } catch (error) {
        console.error("Error saving image:", error);
        return NextResponse.json(
          { ok: false, error: "Failed to save image" },
          { status: 500 }
        );
      }
    }

    // Handle tags
    let tagArray: string[] = [];
    if (tags !== null) {
      tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    // Update event
    const updateQuery = `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      OPTIONAL MATCH (e1:Event {eventId: $eventId})-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event {eventId: $eventId})
      WITH coalesce(e1, e2) AS e
      WHERE e IS NOT NULL
      SET ${updateClause.join(", ")}
      ${tagArray.length > 0 ? `
      WITH e
      OPTIONAL MATCH (e)-[ht:HAS_TAG]->(:Tag)
      DELETE ht
      WITH e
      UNWIND $tagArray AS tagName
      MERGE (t:Tag {name: tagName})
      CREATE (e)-[:HAS_TAG]->(t)
      WITH e
      ` : ""}
      RETURN e.eventId AS eventId, e.title AS title, e.status AS status
    `;

    if (tagArray.length > 0) {
      params.tagArray = tagArray;
    }

    const result = await runQuery<{
      eventId: string;
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
      event: {
        id: result[0].eventId,
        title: result[0].title,
        status: result[0].status,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error updating event:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

/**
 * DELETE /api/institution/events/[eventId]
 * Delete event (soft delete by setting status to "hidden")
 */
export async function DELETE(
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

    // Verify event exists and belongs to institution
    const eventCheck = await runQuery<{
      exists: boolean;
      imageUrl?: string;
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
      RETURN COUNT(e) > 0 AS exists, e.imageUrl AS imageUrl
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

    // Delete image file if exists
    if (eventCheck[0]?.imageUrl) {
      await deleteImageFile(eventCheck[0].imageUrl);
    }

    // Soft delete: set status to "hidden"
    const now = new Date().toISOString();
    await runQuery(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      OPTIONAL MATCH (e1:Event {eventId: $eventId})-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c:Club)-[:BELONGS_TO]->(i)
      OPTIONAL MATCH (c)-[:HOSTS]->(e2:Event {eventId: $eventId})
      WITH coalesce(e1, e2) AS e
      WHERE e IS NOT NULL
      SET e.status = "hidden", e.updatedAt = $now
      `,
      { eventId, institutionId, now }
    );

    return NextResponse.json({
      ok: true,
      message: "Event deleted successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error deleting event:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

