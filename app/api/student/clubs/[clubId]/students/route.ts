import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const collegeId = searchParams.get("collegeId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const programId = searchParams.get("programId") || "";

    // Verify user is president (officer) of the club
    const presidentCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (u:User {userId: $userId})-[mc:MEMBER_OF_CLUB {role: "officer"}]->(c:Club {clubId: $clubId})
      RETURN COUNT(mc) > 0 AS exists
      `,
      { userId: session.userId, clubId }
    );

    if (!presidentCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "You are not a president of this club" },
        { status: 403 }
      );
    }

    // Get the institution ID from the club
    const clubInstitution = await runQuery<{
      institutionId: string;
      userId: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})-[:BELONGS_TO]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COALESCE(i.institutionId, i.userId) AS institutionId, i.userId AS userId
      LIMIT 1
      `,
      { clubId }
    );

    if (!clubInstitution.length) {
      return NextResponse.json(
        { ok: false, error: "Club not found or has no institution" },
        { status: 404 }
      );
    }

    const institutionId = clubInstitution[0].institutionId || clubInstitution[0].userId;

    // Build query with proper MATCH clauses for filters
    const queryParams: Record<string, unknown> = { institutionId, clubId };
    let matchClauses: string[] = [];
    let whereFilters: string[] = [];

    // Search filter
    if (search.trim()) {
      whereFilters.push(
        `(toLower(s.name) CONTAINS $search OR toLower(s.email) CONTAINS $search OR toLower(s.idNumber) CONTAINS $search)`
      );
      queryParams.search = search.trim().toLowerCase();
    }

    // College filter
    if (collegeId && collegeId.trim()) {
      matchClauses.push(`MATCH (s)-[:ENROLLED_IN_COLLEGE]->(colFilter:College {collegeId: $collegeId})`);
      queryParams.collegeId = collegeId;
    }

    // Department filter
    if (departmentId && departmentId.trim()) {
      matchClauses.push(`MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(deptFilter:Department {departmentId: $departmentId})`);
      queryParams.departmentId = departmentId;
    }

    // Program filter
    if (programId && programId.trim()) {
      matchClauses.push(`MATCH (s)-[:ENROLLED_IN]->(progFilter:Program {programId: $programId})`);
      queryParams.programId = programId;
    }

    const whereClause = whereFilters.length > 0 ? `AND ${whereFilters.join(" AND ")}` : "";
    const additionalMatches = matchClauses.length > 0 ? "\n      " + matchClauses.join("\n      ") : "";

    // Get students - exclude existing members of this club
    const students = await runQuery<{
      userId: string;
      name: string;
      email: string;
      idNumber?: string;
      avatarUrl?: string;
      collegeName?: string;
      collegeAcronym?: string;
      departmentName?: string;
      departmentAcronym?: string;
      programAcronym?: string;
    }>(
      `
      MATCH (s:User)-[:MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND s.platformRole = "student"
        AND NOT EXISTS {
          MATCH (s)-[:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        }${additionalMatches}
      ${whereClause}
      OPTIONAL MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College)
      OPTIONAL MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(dept:Department)
      OPTIONAL MATCH (s)-[:ENROLLED_IN]->(prog:Program)
      RETURN DISTINCT
        s.userId AS userId,
        s.name AS name,
        s.email AS email,
        s.idNumber AS idNumber,
        s.avatarUrl AS avatarUrl,
        coalesce(col.name, "") AS collegeName,
        coalesce(col.acronym, "") AS collegeAcronym,
        coalesce(dept.name, "") AS departmentName,
        coalesce(dept.acronym, "") AS departmentAcronym,
        coalesce(prog.acronym, "") AS programAcronym
      ORDER BY s.name
      LIMIT 100
      `,
      queryParams
    );

    // Get filter options (colleges, departments, programs) for the institution
    const colleges = await runQuery<{
      collegeId: string;
      name: string;
      acronym?: string;
    }>(
      `
      MATCH (s:User)-[:MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND s.platformRole = "student"
        AND NOT EXISTS {
          MATCH (s)-[:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        }
      MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College)
      RETURN DISTINCT col.collegeId AS collegeId, col.name AS name, col.acronym AS acronym
      ORDER BY col.name
      `,
      { institutionId, clubId }
    );

    const departments = await runQuery<{
      departmentId: string;
      name: string;
      acronym?: string;
    }>(
      `
      MATCH (s:User)-[:MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND s.platformRole = "student"
        AND NOT EXISTS {
          MATCH (s)-[:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        }
      MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(dept:Department)
      ${collegeId && collegeId.trim() ? `MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College {collegeId: $collegeId})` : ""}
      RETURN DISTINCT dept.departmentId AS departmentId, dept.name AS name, dept.acronym AS acronym
      ORDER BY dept.name
      `,
      { institutionId, clubId, collegeId: collegeId || null }
    );

    const programs = await runQuery<{
      programId: string;
      name: string;
      acronym?: string;
    }>(
      `
      MATCH (s:User)-[:MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND s.platformRole = "student"
        AND NOT EXISTS {
          MATCH (s)-[:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        }
        MATCH (s)-[:ENROLLED_IN]->(prog:Program)
      ${departmentId && departmentId.trim() ? `MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(dept:Department {departmentId: $departmentId})` : ""}
      ${collegeId && collegeId.trim() ? `MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College {collegeId: $collegeId})` : ""}
      RETURN DISTINCT prog.programId AS programId, prog.name AS name, prog.acronym AS acronym
      ORDER BY prog.name
      `,
      { institutionId, clubId, departmentId: departmentId || null, collegeId: collegeId || null }
    );

    return NextResponse.json({
      ok: true,
      students,
      filters: {
        colleges,
        departments,
        programs,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

