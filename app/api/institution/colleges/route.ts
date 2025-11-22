import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import {
  getInstitutionColleges,
  getAllInstitutionColleges,
} from "@/lib/repos/institution";

interface CollegeFormData {
  logo?: File;
  name: string;
  acronym: string;
  email: string;
  phone: string;
  institutionId: string;
}

function isoNow() {
  return new Date().toISOString();
}

function validate(data: CollegeFormData) {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push("College name is required");
  }
  if (!data.acronym?.trim()) {
    errors.push("College acronym is required");
  }
  if (!data.email?.trim()) {
    errors.push("Email is required");
  }
  if (!data.phone?.trim()) {
    errors.push("Phone is required");
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
  const uploadsDir = join(process.cwd(), "public", "uploads", "colleges");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  // Return public URL
  return `/uploads/colleges/${filename}`;
}

/**
 * GET /api/institution/colleges
 * Get list of colleges for the institution
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
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const sortBy = (url.searchParams.get("sortBy") || "name") as "name";
    const sortOrder = (url.searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const result = await getInstitutionColleges(
      institutionId,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/institution/colleges
 * Create a new college
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

    // Handle FormData
    const formData = await req.formData();
    const logoFile = formData.get("logo") as File | null;
    const name = formData.get("name")?.toString() || "";
    const acronym = formData.get("acronym")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const phone = formData.get("phone")?.toString() || "";

    const data: CollegeFormData = {
      logo: logoFile || undefined,
      name,
      acronym,
      email,
      phone,
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
      { institutionId }
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
      } catch (e) {
        return NextResponse.json(
          { ok: false, error: "Failed to save logo file" },
          { status: 500 }
        );
      }
    }

    const collegeId = randomUUID();
    const now = isoNow();

    // Create college node
    const cypher = `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      CREATE (c:College {
        collegeId: $collegeId,
        name: $name,
        acronym: $acronym,
        email: $email,
        phone: $phone,
        logo: $logoUrl,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })-[:BELONGS_TO]->(i)
      RETURN c { .* } AS college
    `;

    const [row] = await runQuery<{ college: any }>(cypher, {
      institutionId,
      collegeId,
      name: data.name.trim(),
      acronym: data.acronym.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      logoUrl,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        ok: true,
        college: row.college,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|invalid/i.test(msg) ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

