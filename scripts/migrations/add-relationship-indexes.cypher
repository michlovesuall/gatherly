// Migration: Add Relationship Property Indexes
// Purpose: Add indexes on relationship properties for better query performance
// Date: 2024
//
// REQUIREMENTS: Neo4j 5.0 or higher (relationship property indexes support)
//
// If your Neo4j version doesn't support relationship property indexes,
// consider denormalizing status to node properties instead.
//
// ROLLBACK: Drop the indexes if needed

// Check Neo4j version (should be 5.0+)
// Run: CALL dbms.components() YIELD name, versions, edition
// Verify version is 5.0 or higher

// Step 1: Create index on STUDENT relationship status
// Note: Relationship property indexes may not be supported in all Neo4j versions
// If this fails, your Neo4j version may not support relationship property indexes

// Attempt to create index (will fail gracefully if not supported)
CREATE INDEX student_status_index IF NOT EXISTS
FOR ()-[r:STUDENT]-()
ON (r.status);

// Step 2: Create index on EMPLOYEE relationship status
CREATE INDEX employee_status_index IF NOT EXISTS
FOR ()-[r:EMPLOYEE]-()
ON (r.status);

// Step 3: Create index on MEMBER_OF relationship status (legacy)
CREATE INDEX member_of_status_index IF NOT EXISTS
FOR ()-[r:MEMBER_OF]-()
ON (r.status);

// Verify indexes
SHOW INDEXES;

// Alternative: If relationship property indexes are not supported,
// consider creating a computed property on User nodes
// This would require denormalizing the relationship status to the node

// Example denormalization approach (commented out):
// MATCH (u:User)-[r:STUDENT|EMPLOYEE|MEMBER_OF]->(i)
// WHERE r.status IS NOT NULL
// SET u.institutionStatus = r.status
// SET u.institutionId = coalesce(i.userId, i.institutionId);

