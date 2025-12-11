// Migration: Normalize Property Names
// Purpose: Standardize property names across the database
// Date: 2024
//
// This script:
// 1. Renames clubName -> name for Club nodes
// 2. Renames clubAcr -> acronym for Club nodes
// 3. Renames institutionName -> name for Institution nodes
//
// ROLLBACK: If needed, reverse the property names

// Step 1: Normalize Club node properties
MATCH (c:Club)
WHERE c.clubName IS NOT NULL AND c.name IS NULL
SET c.name = c.clubName
REMOVE c.clubName;

MATCH (c:Club)
WHERE c.clubAcr IS NOT NULL AND c.acronym IS NULL
SET c.acronym = c.clubAcr
REMOVE c.clubAcr;

// Step 2: Normalize Institution/User node properties
MATCH (i:User)
WHERE i.platformRole = "institution"
  AND i.institutionName IS NOT NULL
  AND i.name IS NULL
SET i.name = i.institutionName
REMOVE i.institutionName;

// Step 3: Handle :Institution label nodes (if they exist)
MATCH (i:Institution)
WHERE i.institutionName IS NOT NULL
  AND i.name IS NULL
SET i.name = i.institutionName
REMOVE i.institutionName;

// Verify migration
MATCH (c:Club)
WHERE c.clubName IS NOT NULL OR c.clubAcr IS NOT NULL
RETURN count(c) AS remainingClubIssues;

MATCH (i)
WHERE (i:User AND i.platformRole = "institution" OR i:Institution)
  AND i.institutionName IS NOT NULL
RETURN count(i) AS remainingInstitutionIssues;

