import { runQuery } from "@/lib/neo4j";
import { isValidPhoneNumber, normalizePhoneNumber, isValidEmailFormat } from "@/lib/validation";
import { RELATIONSHIP_STATUS, PLATFORM_ROLE, USER_STATUS } from "@/lib/constants";

export interface BaseRegistrationRequest {
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

export interface RegistrationValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateRegistrationFields(
  body: BaseRegistrationRequest
): RegistrationValidationResult {
  // Validate required fields
  if (!body.name || !body.idNumber || !body.email || !body.password) {
    return {
      isValid: false,
      error: "Missing required fields: name, idNumber, email, and password are required",
    };
  }

  // Validate field formats
  if (body.name.trim().length < 2) {
    return {
      isValid: false,
      error: "Name must be at least 2 characters long",
    };
  }

  if (body.idNumber.trim().length === 0) {
    return {
      isValid: false,
      error: "ID number is required",
    };
  }

  // Validate email format
  if (!isValidEmailFormat(body.email)) {
    return {
      isValid: false,
      error: "Invalid email format",
    };
  }

  // Validate password strength
  if (body.password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  // Validate institution selection
  if (!body.institutionId && !body.institutionSlug) {
    return {
      isValid: false,
      error: "Missing institution selection",
    };
  }

  // Validate phone number format
  if (!body.phone || !isValidPhoneNumber(body.phone)) {
    return {
      isValid: false,
      error: "Phone number must be exactly 11 digits",
    };
  }

  return { isValid: true };
}

export async function findInstitution(
  institutionId?: string | null,
  institutionSlug?: string | null
): Promise<{
  userId?: string;
  institutionId?: string;
  slug?: string;
} | null> {
  const hasInstitutionId = institutionId && institutionId.trim() !== "";

  const matchInstitutionQuery = hasInstitutionId
    ? `MATCH (i)
       WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
         AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
       RETURN coalesce(i.userId, i.institutionId, "") AS userId, 
              coalesce(i.institutionId, i.userId, "") AS institutionId,
              i.slug AS slug
       LIMIT 1`
    : `MATCH (i)
       WHERE i.slug = $institutionSlug
         AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
       RETURN coalesce(i.userId, i.institutionId, "") AS userId,
              coalesce(i.institutionId, i.userId, "") AS institutionId,
              i.slug AS slug
       LIMIT 1`;

  const institutionParams: Record<string, string> = hasInstitutionId
    ? { institutionId: institutionId!.trim() }
    : { institutionSlug: (institutionSlug || "").trim() };

  if (!institutionParams.institutionId && !institutionParams.institutionSlug) {
    return null;
  }

  const institutionRows = await runQuery<{
    userId?: string;
    institutionId?: string;
    slug?: string;
  }>(matchInstitutionQuery, institutionParams);

  if (!institutionRows.length) {
    return null;
  }

  const institution = institutionRows[0];

  // Extract institution ID
  let institutionIdForCreate = "";

  if (hasInstitutionId && institutionId) {
    institutionIdForCreate = institutionId.trim();
  } else if (institution.userId) {
    institutionIdForCreate = institution.userId;
  } else if (institution.institutionId) {
    institutionIdForCreate = institution.institutionId;
  } else if (institutionSlug) {
    // Query again to get the userId
    const getIdQuery = `
      MATCH (i)
      WHERE i.slug = $institutionSlug
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN i.userId AS userId, i.institutionId AS institutionId
      LIMIT 1
    `;
    const idResult = await runQuery<{ userId?: string; institutionId?: string }>(
      getIdQuery,
      { institutionSlug: institutionSlug.trim() }
    );
    if (idResult.length && (idResult[0].userId || idResult[0].institutionId)) {
      institutionIdForCreate = idResult[0].userId || idResult[0].institutionId || "";
    }
  }

  if (!institutionIdForCreate || institutionIdForCreate.trim() === "") {
    return null;
  }

  return {
    userId: institution.userId,
    institutionId: institution.institutionId || institutionIdForCreate,
    slug: institution.slug,
  };
}

export async function isEmailRegisteredInInstitution(
  email: string,
  institutionId: string
): Promise<boolean> {
  const emailInstitutionCheckCypher = `
    MATCH (u:User)-[:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
    WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      AND u.email = $email
    RETURN u LIMIT 1
  `;
  const emailInstDupRows = await runQuery<{ u?: Record<string, unknown> }>(
    emailInstitutionCheckCypher,
    {
      email,
      institutionId,
    }
  );
  return emailInstDupRows.length > 0;
}

export async function isEmailGloballyRegistered(email: string): Promise<boolean> {
  const emailGlobalCheckCypher = `
    MATCH (u:User)
    WHERE u.email = $email
    RETURN u LIMIT 1
  `;
  const emailGlobalDupRows = await runQuery<{ u?: Record<string, unknown> }>(
    emailGlobalCheckCypher,
    { email }
  );
  return emailGlobalDupRows.length > 0;
}

export async function hasExistingInstitutionRelationship(email: string): Promise<boolean> {
  const existingRelationshipCheck = await runQuery<{ exists: boolean }>(
    `
    MATCH (u:User {email: $email})-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
    RETURN COUNT(r) > 0 AS exists
    LIMIT 1
    `,
    { email }
  );
  return existingRelationshipCheck[0]?.exists || false;
}

export async function validateCollegeBelongsToInstitution(
  collegeId: string,
  institutionId: string
): Promise<boolean> {
  const collegeCheckCypher = `
    MATCH (c:College)-[:BELONGS_TO]->(i)
    WHERE c.collegeId = $collegeId
      AND (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN c LIMIT 1
  `;
  const collegeRows = await runQuery<{ c?: Record<string, unknown> }>(
    collegeCheckCypher,
    { collegeId, institutionId }
  );
  return collegeRows.length > 0;
}

export async function validateDepartmentBelongsToInstitution(
  departmentId: string,
  institutionId: string
): Promise<boolean> {
  const departmentCheckCypher = `
    MATCH (d:Department)-[:BELONGS_TO]->(i)
    WHERE d.departmentId = $departmentId
      AND (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN d LIMIT 1
  `;
  const departmentRows = await runQuery<{ d?: Record<string, unknown> }>(
    departmentCheckCypher,
    { departmentId, institutionId }
  );
  return departmentRows.length > 0;
}

export async function validateProgramBelongsToInstitution(
  programId: string,
  institutionId: string
): Promise<boolean> {
  const programCheckCypher = `
    MATCH (p:Program)-[:BELONGS_TO]->(i)
    WHERE p.programId = $programId
      AND (i.userId = $institutionId OR i.institutionId = $institutionId)
      AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
    RETURN p LIMIT 1
  `;
  const programRows = await runQuery<{ p?: Record<string, unknown> }>(
    programCheckCypher,
    { programId, institutionId }
  );
  return programRows.length > 0;
}

