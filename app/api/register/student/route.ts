import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { runQuery } from "@/lib/neo4j";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";

interface StudentRequest {
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  password: string;
  avatarUrl?: string | null;
  institutionId?: string | null; // prefer institutionId; fallback to slug if you send slug
  institutionSlug?: string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  programId?: string | null;
}

export async function POST(req: Request) {
  try {
    // creates a variable body with interface students to typed data
    const body: StudentRequest = await req.json();

    // Checks if the required fields has values
    if (!body.name || !body.idNumber || !body.email || !body.password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    // Checks if institution fields has values (require at least one)
    if (!body.institutionId && !body.institutionSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing institution selection" },
        { status: 400 }
      );
    }

    // Validate phone number format (exactly 11 digits)
    if (!body.phone || !isValidPhoneNumber(body.phone)) {
      return NextResponse.json(
        { ok: false, error: "Phone number must be exactly 11 digits" },
        { status: 400 }
      );
    }

    // Normalize phone number (remove non-numeric characters)
    const normalizedPhone = normalizePhoneNumber(body.phone);

    // Normalize
    const now = new Date().toISOString();
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Check global phone number uniqueness
    const phoneCheckCypher = `
      MATCH (u:User)
      WHERE u.phone = $phone
      RETURN u LIMIT 1
    `;
    const phoneDupRows = await runQuery<{ u?: Record<string, unknown> }>(
      phoneCheckCypher,
      { phone: normalizedPhone }
    );
    if (phoneDupRows.length) {
      return NextResponse.json(
        { ok: false, error: "This phone number is already registered" },
        { status: 409 }
      );
    }

    // Match the institution Node (supports new userId and legacy institutionId)
    const matchInstitutionCyper = body.institutionId
      ? `MATCH (i)
         WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
           AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
         RETURN i LIMIT 1`
      : `MATCH (i)
         WHERE i.slug = $institutionSlug
           AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
         RETURN i LIMIT 1`;

    const instParams = body.institutionId
      ? { institutionId: body.institutionId }
      : { institutionSlug: body.institutionSlug };
    const instRows = await runQuery<{ i?: Record<string, unknown> }>(
      matchInstitutionCyper,
      instParams
    );

    if (!instRows.length) {
      return NextResponse.json(
        { ok: false, error: "Selected institution not found" },
        { status: 404 }
      );
    }

    const institution = instRows[0].i as { userId?: string; institutionId?: string };

    // Check email uniqueness within the institution
    const emailInstitutionCheckCypher = `
      MATCH (u:User)-[:MEMBER_OF]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND u.email = $email
      RETURN u LIMIT 1
    `;
    const emailInstDupRows = await runQuery<{ u?: Record<string, unknown> }>(
      emailInstitutionCheckCypher,
      {
        email: body.email,
        institutionId: institution.userId || institution.institutionId,
      }
    );
    if (emailInstDupRows.length) {
      return NextResponse.json(
        { ok: false, error: "This email is already registered in this institution" },
        { status: 409 }
      );
    }

    // Check global email reuse prevention (even if user is deleted)
    const emailGlobalCheckCypher = `
      MATCH (u:User)
      WHERE u.email = $email
      RETURN u LIMIT 1
    `;
    const emailGlobalDupRows = await runQuery<{ u?: Record<string, unknown> }>(
      emailGlobalCheckCypher,
      { email: body.email }
    );
    if (emailGlobalDupRows.length) {
      return NextResponse.json(
        { ok: false, error: "This email has been used and cannot be reused" },
        { status: 409 }
      );
    }

    // Checks for existing id number on the database
    const idNumberCheckCypher = `
      MATCH (u:User)
      WHERE u.idNumber = $idNumber
      RETURN u LIMIT 1
    `;
    const idNumberDupRows = await runQuery<{ u?: Record<string, unknown> }>(
      idNumberCheckCypher,
      { idNumber: body.idNumber }
    );
    if (idNumberDupRows.length) {
      return NextResponse.json(
        { ok: false, error: "Student ID already exists" },
        { status: 409 }
      );
    }

    // Match the institution Node (supports new userId and legacy institutionId)
    const matchInstitutionCyper = body.institutionId
      ? `MATCH (i)
         WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
           AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
         RETURN i LIMIT 1`
      : `MATCH (i)
         WHERE i.slug = $institutionSlug
           AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
         RETURN i LIMIT 1`;

    const instParams = body.institutionId
      ? { institutionId: body.institutionId }
      : { institutionSlug: body.institutionSlug };
    const instRows = await runQuery<{ i?: Record<string, unknown> }>(
      matchInstitutionCyper,
      instParams
    );

    if (!instRows.length) {
      return NextResponse.json(
        { ok: false, error: "Selected institution not found" },
        { status: 404 }
      );
    }

    // Create the student with relationships to college, department, and program
    const createCypher = `
      MATCH (i)
      WHERE ${
        body.institutionId
          ? "(i.userId = $institutionId OR i.institutionId = $institutionId)"
          : "i.slug = $institutionSlug"
      }
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      CREATE (u:User {
        userId: $userId,
        name: $name,
        idNumber: $idNumber,
        email: $email,
        phone: $phone,
        hashedPassword: $hashedPassword,
        avatarUrl: $avatarUrl,
        platformRole: $platformRole,
        status: $status,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      CREATE (u)-[m:MEMBER_OF {
        role: $memberRole,
        status: $memberStatus,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(i)
      WITH u, i, m
      ${
        body.collegeId
          ? `
      MATCH (c:College {collegeId: $collegeId})
      CREATE (u)-[:ENROLLED_IN_COLLEGE {
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(c)
      WITH u, i, m
      `
          : ""
      }
      ${
        body.departmentId
          ? `
      MATCH (d:Department {departmentId: $departmentId})
      CREATE (u)-[:ENROLLED_IN_DEPARTMENT {
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(d)
      WITH u, i, m
      `
          : ""
      }
      ${
        body.programId
          ? `
      MATCH (p:Program {programId: $programId})
      CREATE (u)-[:ENROLLED_IN_PROGRAM {
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(p)
      WITH u, i, m
      `
          : ""
      }
      RETURN u { .* } AS user, i { .* } AS institution, m;
    `;

    const params = {
      userId,
      name: body.name,
      idNumber: body.idNumber,
      email: body.email,
      phone: normalizedPhone,
      hashedPassword,
      avatarUrl: body.avatarUrl ?? null,
      platformRole: "student",
      status: "active",
      createdAt: now,
      updatedAt: now,
      memberRole: "student",
      memberStatus: "approved",
      institutionId: body.institutionId,
      institutionSlug: body.institutionSlug,
      collegeId: body.collegeId ?? null,
      departmentId: body.departmentId ?? null,
      programId: body.programId ?? null,
    };

    const [row] = await runQuery<{
      user: Record<string, unknown>;
      institution: Record<string, unknown>;
      m: Record<string, unknown>;
    }>(createCypher, params);

    return NextResponse.json(
      { ok: true, user: row.user, institution: row.institution },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // handle Neo4j constraint violation if it bubbles up
    const status =
      /ConstraintValidationFailed|already exists|unique|UNIQUE/.test(msg)
        ? 409
        : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
