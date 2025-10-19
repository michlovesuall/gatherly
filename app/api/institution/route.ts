import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import type { InstitutionOption } from "@/lib/types";
import neo4j from "neo4j-driver";

interface InstitutionRecord {
  institutionId: string;
  institutionName: string;
  hashedPassword: string;
  emailDomain?: string | null;
  webDomain?: string | null;
  contactPersonEmail: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface InstitutionRequestBody {
  institutionName: string;
  password: string;
  emailDomain?: string | null;
  webDomain?: string | null;
  contactPersonEmail: string;
}

function slugify(name: string) {
  return name
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
  if (!body?.institutionName || typeof body.institutionName !== "string")
    errors.push("institutionName is required");
  if (!body?.password || typeof body.password !== "string")
    errors.push("password is required");
  if (!body?.contactPersonEmail || typeof body.contactPersonEmail !== "string")
    errors.push("contactPersonEmail is required");
  if (errors.length) throw new Error(errors.join(", "));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    validate(body);

    const institutionId = randomUUID();
    const slug = slugify(body.institutionName);
    const now = isoNow();
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const params = {
      institutionId,
      institutionName: body.institutionName,
      hashedPassword,
      emailDomain: body.emailDomain ?? null,
      webDomain: body.webDomain ?? null,
      contactPersonEmail: body.contactPersonEmail,
      slug,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const cypher = `
      CREATE (i:Institution {
        institutionId:$institutionId,
        institutionName:$institutionName,
        hashedPassword:$hashedPassword,
        emailDomain:$emailDomain,
        webDomain:$webDomain,
        contactPersonEmail:$contactPersonEmail,
        slug:$slug,
        status:$status,
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
      `(toLower(i.institutionName) CONTAINS $q OR toLower(i.slug) CONTAINS $q)`
    );
  if (status) filters.push(`i.status = $status`);
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const params = { q, status, limit: neo4j.int(limitSafe) };

  const cypher = `
    MATCH (i:Institution)
    ${where}
    RETURN {
        id: i.institutionId,
        value: i.slug,
        label: i.institutionName,
        status: coalesce(i.status, "pending")
    } AS option
    ORDER BY i.institutionName ASC
    LIMIT $limit
    `;

  const rows = await runQuery<{ option: InstitutionOption }>(cypher, params);
  return NextResponse.json(
    { ok: true, items: rows.map((r) => r.option) },
    { status: 200 }
  );
}
