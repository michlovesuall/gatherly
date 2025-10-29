import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import type { InstitutionOption } from "@/lib/types";
import neo4j from "neo4j-driver";

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
  if (!body?.contactPersonEmail || typeof body.contactPersonEmail !== "string")
    errors.push("contactPersonEmail is required");
  if (errors.length) throw new Error(errors.join(", "));
}

export async function POST(req: Request) {
  try {
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
      status: "active",
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = url.searchParams.get("status");

  const limitRaw = url.searchParams.get("limit");
  const limitNum = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 100;
  const limitSafe = Math.min(Math.max(0, Math.trunc(limitNum)), 200);

  const filters: string[] = [];
  if (q)
    filters.push(
      `(toLower(i.name) CONTAINS $q OR toLower(i.slug) CONTAINS $q)`
    );
  if (status) filters.push(`i.status = $status`);
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const params = { q, status, limit: neo4j.int(limitSafe) };

  const cypher = `
    MATCH (i:User {platformRole: "institution"})
    ${where}
    RETURN {
        id: coalesce(i.userId, i.institutionId),
        value: i.slug,
        label: coalesce(i.name, i.institutionName),
        status: coalesce(i.status, "active")
    } AS option
    ORDER BY i.name ASC
    LIMIT $limit
    `;

  const rows = await runQuery<{ option: InstitutionOption }>(cypher, params);
  return NextResponse.json(
    { ok: true, items: rows.map((r) => r.option) },
    { status: 200 }
  );
}
