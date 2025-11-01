import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface ClubFormData {
  logo?: File;
  clubName: string;
  clubAcr: string;
  about?: string;
  institutionId: string;
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isoNow() {
  return new Date().toISOString();
}

function validate(data: ClubFormData) {
  const errors: string[] = [];

  if (!data.clubName?.trim()) {
    errors.push("Club name is required");
  }
  if (!data.clubAcr?.trim()) {
    errors.push("Club acronym is required");
  }
  if (!data.institutionId?.trim()) {
    errors.push("Institution is required");
  }
  if (!data.logo) {
    errors.push("Logo is required");
  }

  if (errors.length) throw new Error(errors.join(", "));
}

async function saveLogoFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), "public", "uploads", "clubs");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  // Return public URL
  return `/uploads/clubs/${filename}`;
}

/**
 * POST /api/admin/clubs
 * Create a new club with pending status (super-admin only)
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

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Handle FormData
    const formData = await req.formData();
    const logoFile = formData.get("logo") as File | null;
    const clubName = formData.get("clubName")?.toString() || "";
    const clubAcr = formData.get("clubAcr")?.toString() || "";
    const about = formData.get("about")?.toString();
    const institutionId = formData.get("institutionId")?.toString() || "";

    const data: ClubFormData = {
      logo: logoFile || undefined,
      clubName,
      clubAcr,
      about,
      institutionId,
    };

    validate(data);

    // Verify institution exists and is approved
    const instCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND coalesce(i.status, "") = "approved"
      RETURN COUNT(i) > 0 AS exists
      `,
      { institutionId: data.institutionId }
    );

    if (!instCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Institution not found or not approved" },
        { status: 404 }
      );
    }

    // Save logo file
    let logoUrl: string | null = null;
    if (logoFile) {
      try {
        logoUrl = await saveLogoFile(logoFile);
      } catch (err) {
        console.error("Error saving logo:", err);
        return NextResponse.json(
          { ok: false, error: "Failed to save logo file" },
          { status: 500 }
        );
      }
    }

    const clubId = randomUUID();
    const slug = slugify(data.clubName);
    const now = isoNow();

    const params = {
      clubId,
      logo: logoUrl,
      clubName: data.clubName.trim(),
      clubAcr: data.clubAcr.trim(),
      about: data.about?.trim() || null,
      slug,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      institutionId: data.institutionId,
    };

    const cypher = `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      CREATE (c:Club {
        clubId: $clubId,
        logo: $logo,
        name: $clubName,
        clubName: $clubName,
        acronym: $clubAcr,
        clubAcr: $clubAcr,
        about: $about,
        slug: $slug,
        status: $status,
        createdAt: $createdAt,
        created_at: $createdAt,
        updatedAt: $updatedAt,
        updated_at: $updatedAt
      })
      CREATE (c)-[:BELONGS_TO]->(i)
      RETURN c { .* } AS club, i.name AS institutionName
    `;

    const [row] = await runQuery<{ club: Record<string, unknown>; institutionName: string }>(
      cypher,
      params
    );

    return NextResponse.json(
      {
        ok: true,
        club: row.club,
        institutionName: row.institutionName,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    const status =
      /ConstraintValidationFailed|already exists|already exists with/.test(msg)
        ? 409
        : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
