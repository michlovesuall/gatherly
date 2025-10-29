import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { runQuery } from "@/lib/neo4j";

interface EmployeeRequest {
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  password: string;
  avatarUrl?: string | null;
  institutionId?: string | null;
  institutionSlug?: string | null;
}

export async function POST(req: Request) {
  try {
    const body: EmployeeRequest = await req.json();

    if (!body.name || !body.idNumber || !body.email || !body.password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!body.institutionId && !body.institutionSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing institution selection" },
        { status: 400 }
      );
    }

    const dup = await runQuery(
      "MATCH (u:User) WHERE u.email=$email OR u.idNumber=$idNumber RETURN u LIMIT 1",
      { email: body.email, idNumber: body.idNumber }
    );
    if (dup.length) {
      return NextResponse.json(
        { ok: false, error: "User with that email or ID already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(body.password, 12);

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
      platformRole: "employee",
      status: "active",
      createdAt: now,
      updatedAt: now,
      memberRole: "employee",
      memberStatus: "approved",
      institutionId: body.institutionId,
      institutionSlug: body.institutionSlug,
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
    const status =
      /ConstraintValidationFailed|already exists|unique|UNIQUE/.test(msg)
        ? 409
        : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
