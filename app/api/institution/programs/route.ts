import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { getInstitutionPrograms } from "@/lib/repos/institution";

interface ProgramFormData {
  name: string;
  acronym: string;
  departmentId: string;
  institutionId: string;
}

function isoNow() {
  return new Date().toISOString();
}

function validate(data: ProgramFormData) {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push("Program name is required");
  }
  if (!data.acronym?.trim()) {
    errors.push("Program acronym is required");
  }
  if (!data.departmentId?.trim()) {
    errors.push("Department is required");
  }

  if (errors.length) throw new Error(errors.join(", "));
}

/**
 * GET /api/institution/programs
 * Get list of programs for the institution
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

    const result = await getInstitutionPrograms(
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
 * POST /api/institution/programs
 * Create a new program
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

    const body = await req.json();
    const name = body.name?.toString() || "";
    const acronym = body.acronym?.toString() || "";
    const departmentId = body.departmentId?.toString() || "";

    const data: ProgramFormData = {
      name,
      acronym,
      departmentId,
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

    // Verify department belongs to institution
    const deptCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (d:Department {departmentId: $departmentId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COUNT(d) > 0 AS exists
      `,
      { departmentId, institutionId }
    );

    if (!deptCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Department not found or does not belong to institution" },
        { status: 404 }
      );
    }

    const programId = randomUUID();
    const now = isoNow();

    // Create program node
    const cypher = `
      MATCH (i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      MATCH (d:Department {departmentId: $departmentId})-[:BELONGS_TO]->(i)
      CREATE (p:Program {
        programId: $programId,
        name: $name,
        acronym: $acronym,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })-[:BELONGS_TO]->(i),
      (p)-[:BELONGS_TO_DEPARTMENT]->(d)
      RETURN p { .* } AS program
    `;

    const [row] = await runQuery<{ program: any }>(cypher, {
      institutionId,
      departmentId,
      programId,
      name: data.name.trim(),
      acronym: data.acronym.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        ok: true,
        program: row.program,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|invalid/i.test(msg) ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

