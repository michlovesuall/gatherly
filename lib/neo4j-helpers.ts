export function getInstitutionMatchWhere(
  institutionIdVar: string = "i",
  institutionIdParam: string = "institutionId"
): string {
  return `WHERE (${institutionIdVar}.userId = $${institutionIdParam} OR ${institutionIdVar}.institutionId = $${institutionIdParam})
      AND (coalesce(${institutionIdVar}.platformRole, "") = "institution" OR ${institutionIdVar}:Institution)`;
}

export function getUserInstitutionRelationshipMatch(
  userVar: string = "u",
  institutionVar: string = "i",
  relationshipVar: string = "r"
): string {
  return `MATCH (${userVar}:User)-[${relationshipVar}:STUDENT|EMPLOYEE|MEMBER_OF]->(${institutionVar})`;
}

export function getOptionalUserInstitutionRelationshipMatch(
  userVar: string = "u",
  institutionVar: string = "i",
  relationshipVar: string = "r"
): string {
  return `OPTIONAL MATCH (${userVar}:User)-[${relationshipVar}:STUDENT|EMPLOYEE|MEMBER_OF]->(${institutionVar})`;
}

