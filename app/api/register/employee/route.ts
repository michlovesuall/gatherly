import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { runQuery } from "@/lib/neo4j";
import { normalizePhoneNumber } from "@/lib/validation";
import { getSession } from "@/lib/auth/session";
import { RELATIONSHIP_STATUS, PLATFORM_ROLE, USER_STATUS } from "@/lib/constants";
import {
  validateRegistrationFields,
  findInstitution,
  isEmailRegisteredInInstitution,
  isEmailGloballyRegistered,
  hasExistingInstitutionRelationship,
  validateCollegeBelongsToInstitution,
  validateDepartmentBelongsToInstitution,
  validateProgramBelongsToInstitution,
} from "@/lib/shared-registration";

interface EmployeeRequest {
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  password: string;
  avatarUrl?: string | null;
  institutionId?: string | null;
  institutionSlug?: string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  programId?: string | null;
}

export async function POST(req: Request) {
  try {
    // Check if account is being created by institution or super_admin
    const session = await getSession();
    const isCreatedByInstitutionOrAdmin = 
      session && (session.role === "institution" || session.role === "super_admin");
    
    const body: EmployeeRequest = await req.json();

    // Validate registration fields using shared utility
    const validation = validateRegistrationFields(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }

    // Normalize phone number (remove non-numeric characters)
    const normalizedPhone = normalizePhoneNumber(body.phone);

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

    // Find institution using shared utility
    const institution = await findInstitution(body.institutionId, body.institutionSlug);
    if (!institution || !institution.institutionId) {
      return NextResponse.json(
        { ok: false, error: "Selected institution not found" },
        { status: 404 }
      );
    }
    const institutionIdForCreate = institution.institutionId;

    // Check email uniqueness within the institution using shared utility
    if (await isEmailRegisteredInInstitution(body.email, institutionIdForCreate)) {
      return NextResponse.json(
        { ok: false, error: "This email is already registered in this institution" },
        { status: 409 }
      );
    }

    // Check global email reuse prevention using shared utility
    if (await isEmailGloballyRegistered(body.email)) {
      return NextResponse.json(
        { ok: false, error: "This email has been used and cannot be reused" },
        { status: 409 }
      );
    }

    // Check for existing ID number
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
        { ok: false, error: "Employee ID already exists" },
        { status: 409 }
      );
    }

    // Check if user already has a relationship to any institution using shared utility
    if (await hasExistingInstitutionRelationship(body.email)) {
      return NextResponse.json(
        { ok: false, error: "User already has a relationship with an institution" },
        { status: 409 }
      );
    }

    // Validate that college, department, and program belong to the institution using shared utilities
    if (body.collegeId) {
      if (!(await validateCollegeBelongsToInstitution(body.collegeId, institutionIdForCreate))) {
        return NextResponse.json(
          { ok: false, error: "Selected college does not belong to this institution" },
          { status: 400 }
        );
      }
    }

    if (body.departmentId) {
      if (!(await validateDepartmentBelongsToInstitution(body.departmentId, institutionIdForCreate))) {
        return NextResponse.json(
          { ok: false, error: "Selected department does not belong to this institution" },
          { status: 400 }
        );
      }
    }

    if (body.programId) {
      if (!(await validateProgramBelongsToInstitution(body.programId, institutionIdForCreate))) {
        return NextResponse.json(
          { ok: false, error: "Selected program does not belong to this institution" },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create the employee with relationships to college, department, and program
    // Use the institution ID we already found to avoid parameter issues
    if (!institutionIdForCreate || typeof institutionIdForCreate !== 'string' || institutionIdForCreate.trim() === '') {
      return NextResponse.json(
        { ok: false, error: "Invalid institution identifier" },
        { status: 400 }
      );
    }
    
    const createCypher = `
      MATCH (i)
      WHERE (i.userId = $institutionIdForCreate OR i.institutionId = $institutionIdForCreate)
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
      CREATE (u)-[:EMPLOYEE {
        status: $memberStatus,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(i)
      WITH u, i
      ${
        body.collegeId
          ? `
      MATCH (c:College {collegeId: $collegeId})-[:BELONGS_TO]->(i)
      MERGE (u)-[ec:ENROLLED_IN_COLLEGE]->(c)
      ON CREATE SET
        ec.createdAt = $createdAt,
        ec.updatedAt = $updatedAt
      ON MATCH SET
        ec.updatedAt = $updatedAt
      WITH u, i
      `
          : ""
      }
      ${
        body.departmentId
          ? `
      MATCH (d:Department {departmentId: $departmentId})-[:BELONGS_TO]->(i)
      MERGE (u)-[ed:ENROLLED_IN_DEPARTMENT]->(d)
      ON CREATE SET
        ed.createdAt = $createdAt,
        ed.updatedAt = $updatedAt
      ON MATCH SET
        ed.updatedAt = $updatedAt
      WITH u, i
      `
          : ""
      }
      ${
        body.programId
          ? `
      MATCH (p:Program {programId: $programId})-[:BELONGS_TO]->(i)
      MERGE (u)-[ep:ENROLLED_IN]->(p)
      ON CREATE SET
        ep.createdAt = $createdAt,
        ep.updatedAt = $updatedAt
      ON MATCH SET
        ep.updatedAt = $updatedAt
      WITH u, i
      `
          : ""
      }
      RETURN u { .* } AS user, i { .* } AS institution;
    `;

    const params: Record<string, unknown> = {
      userId,
      name: body.name,
      idNumber: body.idNumber,
      email: body.email,
      phone: normalizedPhone,
      hashedPassword,
      avatarUrl: body.avatarUrl ?? null,
      platformRole: PLATFORM_ROLE.EMPLOYEE,
      status: USER_STATUS.ACTIVE,
      memberStatus: isCreatedByInstitutionOrAdmin ? RELATIONSHIP_STATUS.ACTIVE : RELATIONSHIP_STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
      institutionIdForCreate,
    };

    // Only add optional parameters if they have values
    if (body.collegeId) {
      params.collegeId = body.collegeId;
    }
    if (body.departmentId) {
      params.departmentId = body.departmentId;
    }
    if (body.programId) {
      params.programId = body.programId;
    }

    const [row] = await runQuery<{
      user: Record<string, unknown>;
      institution: Record<string, unknown>;
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
