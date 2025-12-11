// Migration: Migrate MEMBER_OF to STUDENT/EMPLOYEE
// Purpose: Convert legacy MEMBER_OF relationships to STUDENT or EMPLOYEE based on platformRole
// Date: 2024
//
// WARNING: This script deletes MEMBER_OF relationships after migration.
// Ensure all code has been updated to use STUDENT|EMPLOYEE|MEMBER_OF before running.
//
// ROLLBACK: If needed, recreate MEMBER_OF relationships from STUDENT/EMPLOYEE relationships
// (This would require storing the original relationship data before migration)

// Step 1: Migrate MEMBER_OF to STUDENT for users with platformRole = "student" or NULL
MATCH (u:User)-[old:MEMBER_OF]->(i)
WHERE (u.platformRole IS NULL OR u.platformRole = "student")
  AND NOT EXISTS((u)-[:STUDENT]->(i))
CREATE (u)-[new:STUDENT {
  status: coalesce(old.status, "pending"),
  createdAt: coalesce(old.createdAt, datetime()),
  updatedAt: datetime()
}]->(i)
WITH old, new
DELETE old;

// Step 2: Migrate MEMBER_OF to EMPLOYEE for users with platformRole = "employee"
MATCH (u:User)-[old:MEMBER_OF]->(i)
WHERE u.platformRole = "employee"
  AND NOT EXISTS((u)-[:EMPLOYEE]->(i))
CREATE (u)-[new:EMPLOYEE {
  status: coalesce(old.status, "pending"),
  createdAt: coalesce(old.createdAt, datetime()),
  updatedAt: datetime()
}]->(i)
WITH old, new
DELETE old;

// Step 3: Handle remaining MEMBER_OF relationships (should be minimal)
// These might be institution users or other edge cases
MATCH (u:User)-[r:MEMBER_OF]->(i)
WHERE u.platformRole IS NOT NULL
  AND u.platformRole <> "student"
  AND u.platformRole <> "employee"
RETURN u.userId, u.platformRole, count(r) AS remainingRelationships
ORDER BY remainingRelationships DESC
LIMIT 10;

// Verify migration
MATCH ()-[r:MEMBER_OF]->()
RETURN count(r) AS remainingMemberOfRelationships;

MATCH (u:User)-[r:STUDENT|EMPLOYEE]->(i)
WHERE r.status IS NOT NULL
RETURN count(r) AS migratedRelationships;

