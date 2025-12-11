import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { RELATIONSHIP_STATUS } from "@/lib/constants";

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

    if (session.role !== "employee" && session.role !== "staff") {
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

    // Verify advisor is actually an advisor of this club and get institution
    const advisorInstitution = await runQuery<{
      institutionId: string;
      userId: string;
    }>(
      `
      MATCH (e:User {userId: $employeeId})-[:ADVISES]->(c:Club {clubId: $clubId})
      MATCH (c)-[:BELONGS_TO]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN COALESCE(i.institutionId, i.userId) AS institutionId, i.userId AS userId
      LIMIT 1
      `,
      { employeeId: session.userId, clubId }
    );

    if (!advisorInstitution.length) {
      return NextResponse.json(
        { ok: false, error: "You are not an advisor of this club" },
        { status: 403 }
      );
    }

    const institutionId = advisorInstitution[0].institutionId || advisorInstitution[0].userId;

    // Build query with proper MATCH clauses for filters
    const queryParams: Record<string, unknown> = { 
      institutionId, 
      clubId,
      pendingStatus: RELATIONSHIP_STATUS.PENDING,
      activeStatus: RELATIONSHIP_STATUS.ACTIVE
    };
    let matchClauses: string[] = [];
    let whereFilters: string[] = [];

    // Search filter
    if (search.trim()) {
      whereFilters.push(
        `(toLower(s.name) CONTAINS $search OR toLower(s.email) CONTAINS $search OR toLower(s.idNumber) CONTAINS $search)`
      );
      queryParams.search = search.trim().toLowerCase();
    }

    // College filter - use MATCH instead of WHERE pattern
    if (collegeId && collegeId.trim()) {
      matchClauses.push(`MATCH (s)-[:ENROLLED_IN_COLLEGE]->(colFilter:College {collegeId: $collegeId})`);
      queryParams.collegeId = collegeId;
    }

    // Department filter - use MATCH instead of WHERE pattern
    if (departmentId && departmentId.trim()) {
      matchClauses.push(`MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(deptFilter:Department {departmentId: $departmentId})`);
      queryParams.departmentId = departmentId;
    }

    // Program filter - use MATCH instead of WHERE pattern
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
      MATCH (s:User {platformRole: "student"})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND coalesce(r.status, $pendingStatus) = $activeStatus${whereClause}${additionalMatches}
      OPTIONAL MATCH (s)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      WITH s, mc
      WHERE mc IS NULL
      OPTIONAL MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College)
      OPTIONAL MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(d:Department)
      OPTIONAL MATCH (s)-[:ENROLLED_IN]->(p:Program)
      WITH s, col, d, p
      RETURN 
        s.userId AS userId,
        s.name AS name,
        s.email AS email,
        s.idNumber AS idNumber,
        s.avatarUrl AS avatarUrl,
        col.name AS collegeName,
        col.acronym AS collegeAcronym,
        d.name AS departmentName,
        d.acronym AS departmentAcronym,
        p.acronym AS programAcronym
      ORDER BY s.name ASC
      LIMIT 100
      `,
      queryParams
    );

    // Get available colleges, departments, and programs for filters
    // Only get colleges that have students who are not already members
    const colleges = await runQuery<{
      collegeId: string;
      name: string;
      acronym?: string;
    }>(
      `
      MATCH (s:User {platformRole: "student"})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
      WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
        AND (i.institutionId = $institutionId OR i.userId = $institutionId)
        AND coalesce(r.status, $pendingStatus) = $activeStatus
      OPTIONAL MATCH (s)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
      WITH s, mc
      WHERE mc IS NULL
      MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College)
      RETURN DISTINCT col.collegeId AS collegeId, col.name AS name, col.acronym AS acronym
      ORDER BY col.name ASC
      `,
      { 
        institutionId, 
        clubId,
        pendingStatus: RELATIONSHIP_STATUS.PENDING,
        activeStatus: RELATIONSHIP_STATUS.ACTIVE
      }
    );

    // Build departments query based on college filter
    // Only get departments that have students who are not already members
    const deptQueryParams: Record<string, unknown> = { 
      institutionId, 
      clubId,
      pendingStatus: RELATIONSHIP_STATUS.PENDING,
      activeStatus: RELATIONSHIP_STATUS.ACTIVE
    };
    
    let departments;
    if (collegeId && collegeId.trim()) {
      deptQueryParams.collegeId = collegeId;
      departments = await runQuery<{
        departmentId: string;
        name: string;
        acronym?: string;
      }>(
        `
        MATCH (s:User {platformRole: "student"})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
        WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
          AND (i.institutionId = $institutionId OR i.userId = $institutionId)
          AND coalesce(r.status, $pendingStatus) = $activeStatus
        OPTIONAL MATCH (s)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        WITH s, mc
        WHERE mc IS NULL
        MATCH (s)-[:ENROLLED_IN_COLLEGE]->(col:College {collegeId: $collegeId})
        MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(d:Department)
        RETURN DISTINCT d.departmentId AS departmentId, d.name AS name, d.acronym AS acronym
        ORDER BY d.name ASC
        `,
        deptQueryParams
      );
    } else {
      departments = await runQuery<{
        departmentId: string;
        name: string;
        acronym?: string;
      }>(
        `
        MATCH (s:User {platformRole: "student"})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
        WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
          AND (i.institutionId = $institutionId OR i.userId = $institutionId)
          AND coalesce(r.status, $pendingStatus) = $activeStatus
        OPTIONAL MATCH (s)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        WITH s, mc
        WHERE mc IS NULL
        MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(d:Department)
        RETURN DISTINCT d.departmentId AS departmentId, d.name AS name, d.acronym AS acronym
        ORDER BY d.name ASC
        `,
        deptQueryParams
      );
    }

    // Build programs query based on department filter
    // Only get programs that have students who are not already members
    const progQueryParams: Record<string, unknown> = { 
      institutionId, 
      clubId,
      pendingStatus: RELATIONSHIP_STATUS.PENDING,
      activeStatus: RELATIONSHIP_STATUS.ACTIVE
    };
    
    let programs;
    if (departmentId && departmentId.trim()) {
      progQueryParams.departmentId = departmentId;
      programs = await runQuery<{
        programId: string;
        name: string;
        acronym?: string;
      }>(
        `
        MATCH (s:User {platformRole: "student"})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
        WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
          AND (i.institutionId = $institutionId OR i.userId = $institutionId)
          AND coalesce(r.status, $pendingStatus) = $activeStatus
        OPTIONAL MATCH (s)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        WITH s, mc
        WHERE mc IS NULL
        MATCH (s)-[:ENROLLED_IN_DEPARTMENT]->(d:Department {departmentId: $departmentId})
        MATCH (s)-[:ENROLLED_IN]->(p:Program)
        RETURN DISTINCT p.programId AS programId, p.name AS name, p.acronym AS acronym
        ORDER BY p.name ASC
        `,
        progQueryParams
      );
    } else {
      programs = await runQuery<{
        programId: string;
        name: string;
        acronym?: string;
      }>(
        `
        MATCH (s:User {platformRole: "student"})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
        WHERE (coalesce(i.platformRole, "") = "institution" OR i:Institution)
          AND (i.institutionId = $institutionId OR i.userId = $institutionId)
          AND coalesce(r.status, $pendingStatus) = $activeStatus
        OPTIONAL MATCH (s)-[mc:MEMBER_OF_CLUB]->(c:Club {clubId: $clubId})
        WITH s, mc
        WHERE mc IS NULL
        MATCH (s)-[:ENROLLED_IN]->(p:Program)
        RETURN DISTINCT p.programId AS programId, p.name AS name, p.acronym AS acronym
        ORDER BY p.name ASC
        `,
        progQueryParams
      );
    }

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

