import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { runQuery } from "@/lib/neo4j";

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
    // Normalize
    const now = new Date().toISOString();
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Checks for existing email or id number on the database
    const duplicateCheckCypher = `
      MATCH (u:User)
      WHERE u.email = $email or u.idNumber = $idNumber
      RETURN u LIMIT 1
    `;

    // Execute the query
    const dupRows = await runQuery<{ u?: Record<string, unknown> }>(
      duplicateCheckCypher,
      {
        email: body.email,
        idNumber: body.idNumber,
      }
    );
    // Checks if the query returns any data from the database
    if (dupRows.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email or Student ID already exists",
        },
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
      phone: body.phone,
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
