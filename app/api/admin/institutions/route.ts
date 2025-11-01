import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

interface InstitutionRecord {
  userId: string;
  name: string;
  idNumber?: string | null;
  hashedPassword: string;
  email?: string | null;
  phone?: string | null;
  webDomain?: string | null;
  contactPersonEmail: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface InstitutionRequestBody {
  name: string;
  password: string;
  email?: string | null;
  idNumber?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  webDomain?: string | null;
  contactPersonEmail: string;
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

function validate(body: InstitutionRequestBody) {
  const errors: string[] = [];
  if (!body?.name || typeof body.name !== "string")
    errors.push("name is required");
  if (!body?.password || typeof body.password !== "string")
    errors.push("password is required");
  if (!body?.email || typeof body.email !== "string")
    errors.push("email is required");
  if (!body?.idNumber || typeof body.idNumber !== "string")
    errors.push("idNumber is required");
  if (!body?.phone || typeof body.phone !== "string")
    errors.push("phone is required");
  if (!body?.contactPersonEmail || typeof body.contactPersonEmail !== "string")
    errors.push("contactPersonEmail is required");
  if (errors.length) throw new Error(errors.join(", "));
}

/**
 * POST /api/admin/institutions
 * Create a new institution with approved status (super-admin only)
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

    const body = await req.json();
    validate(body);

    const userId = randomUUID();
    const slug = slugify(body.name);
    const now = isoNow();
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const params = {
      userId,
      name: body.name,
      idNumber: body.idNumber ?? null,
      hashedPassword,
      email: body.email ?? null,
      phone: body.phone ?? null,
      avatarUrl: body.avatarUrl ?? null,
      webDomain: body.webDomain ?? null,
      contactPersonEmail: body.contactPersonEmail,
      slug,
      status: "approved", // Automatically approved when created by super-admin
      createdAt: now,
      updatedAt: now,
    };

    const cypher = `
      CREATE (i:User {
        userId:$userId,
        name:$name,
        idNumber:$idNumber,
        hashedPassword:$hashedPassword,
        email:$email,
        phone:$phone,
        avatarUrl:$avatarUrl,
        webDomain:$webDomain,
        contactPersonEmail:$contactPersonEmail,
        slug:$slug,
        status:$status,
        platformRole:"institution",
        createdAt:$createdAt,
        updatedAt:$updatedAt
      })
      RETURN i { .* } AS institution
    `;

    const [row] = await runQuery<{ institution: InstitutionRecord }>(
      cypher,
      params
    );

    return NextResponse.json(
      {
        ok: true,
        institution: row.institution,
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

