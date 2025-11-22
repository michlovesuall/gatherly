import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getInstitutionDepartments } from "@/lib/repos/institution";

interface DepartmentFormData {
  logo?: File;
  name: string;
  acronym: string;
  email: string;
  phone: string;
  collegeId: string;
  institutionId: string;
}

function isoNow() {
  return new Date().toISOString();
}

function validate(data: DepartmentFormData) {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push("Department name is required");
  }
  if (!data.acronym?.trim()) {
    errors.push("Department acronym is required");
  }
  if (!data.email?.trim()) {
    errors.push("Email is required");
  }
  if (!data.phone?.trim()) {
    errors.push("Phone is required");
  }
  if (!data.collegeId?.trim()) {
    errors.push("College is required");
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
  const uploadsDir = join(process.cwd(), "public", "uploads", "departments");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  // Return public URL
  return `/uploads/departments/${filename}`;
}

/**
 * GET /api/institution/departments
 * Get list of departments for the institution
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

    const result = await getInstitutionDepartments(
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
 * POST /api/institution/departments
 * Create a new department
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
    const collegeId = formData.get("collegeId")?.toString() || "";

    const data: DepartmentFormData = {
      logo: logoFile || undefined,
      name,
      acronym,
      email,
      phone,
      collegeId,
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

    // Verify college belongs to institution
    const collegeCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (c:College {collegeId: $collegeId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COUNT(c) > 0 AS exists
      `,
      { collegeId, institutionId }
    );

    if (!collegeCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "College not found or does not belong to institution" },
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

    const departmentId = randomUUID();
    const now = isoNow();

    // Create department node
    const cypher = `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      MATCH (c:College {collegeId: $collegeId})-[:BELONGS_TO]->(i)
      CREATE (d:Department {
        departmentId: $departmentId,
        name: $name,
        acronym: $acronym,
        email: $email,
        phone: $phone,
        logo: $logoUrl,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })-[:BELONGS_TO]->(i),
      (d)-[:BELONGS_TO_COLLEGE]->(c)
      RETURN d { .* } AS department
    `;

    const [row] = await runQuery<{ department: any }>(cypher, {
      institutionId,
      collegeId,
      departmentId,
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
        department: row.department,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|invalid/i.test(msg) ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

