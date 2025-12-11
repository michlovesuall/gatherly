// Migration: Set Default Relationship Status Values
// Purpose: Set default status values on relationships to avoid NULL
// Date: 2024
//
// This script sets status = "pending" for all relationships where status IS NULL
// This allows queries to avoid using coalesce() in WHERE clauses, improving index usage
//
// ROLLBACK: If needed, set status back to NULL for relationships that were NULL before

// Step 1: Set default status for STUDENT relationships
MATCH (u:User)-[r:STUDENT]->(i)
WHERE r.status IS NULL
SET r.status = "pending"
SET r.updatedAt = datetime();

// Step 2: Set default status for EMPLOYEE relationships
MATCH (u:User)-[r:EMPLOYEE]->(i)
WHERE r.status IS NULL
SET r.status = "pending"
SET r.updatedAt = datetime();

// Step 3: Set default status for MEMBER_OF relationships (legacy)
MATCH (u:User)-[r:MEMBER_OF]->(i)
WHERE r.status IS NULL
SET r.status = "pending"
SET r.updatedAt = datetime();

// Verify migration
MATCH ()-[r:STUDENT|EMPLOYEE|MEMBER_OF]->()
WHERE r.status IS NULL
RETURN count(r) AS remainingNullStatus;

