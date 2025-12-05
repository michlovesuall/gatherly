import { runQuery } from "@/lib/neo4j";


export async function ensureDatabaseConstraints(): Promise<void> {
  // Create unique constraints for data integrity
  const constraints = [
    // User node constraints
    `CREATE CONSTRAINT user_userId_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.userId IS UNIQUE`,
    
    `CREATE CONSTRAINT user_email_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.email IS UNIQUE`,
    
    `CREATE CONSTRAINT user_phone_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.phone IS UNIQUE`,
    
    `CREATE CONSTRAINT user_idNumber_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.idNumber IS UNIQUE`,
    
    // Institution constraints (composite unique constraint for slug + platformRole)
    `CREATE CONSTRAINT institution_slug_unique IF NOT EXISTS
      FOR (i:User) REQUIRE (i.slug, i.platformRole) IS UNIQUE
      WHERE i.platformRole = "institution"`,
    
    // Event constraints
    `CREATE CONSTRAINT event_eventId_unique IF NOT EXISTS
      FOR (e:Event) REQUIRE e.eventId IS UNIQUE`,
    
    // Club constraints
    `CREATE CONSTRAINT club_clubId_unique IF NOT EXISTS
      FOR (c:Club) REQUIRE c.clubId IS UNIQUE`,
    
    `CREATE CONSTRAINT club_slug_unique IF NOT EXISTS
      FOR (c:Club) REQUIRE c.slug IS UNIQUE`,
    
    // RSVP constraints
    `CREATE CONSTRAINT rsvp_rsvpKey_unique IF NOT EXISTS
      FOR (r:RSVP) REQUIRE r.rsvpKey IS UNIQUE`,
  ];

  // Execute each constraint (IF NOT EXISTS makes it safe to run multiple times)
  for (const constraint of constraints) {
    try {
      await runQuery(constraint);
    } catch (error) {
      // Log but don't fail - constraint might already exist with different syntax
      // or Neo4j version might not support IF NOT EXISTS
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[DB Constraints] Could not create constraint: ${errorMessage}`);
      
      // If IF NOT EXISTS is not supported, try without it (for older Neo4j versions)
      if (errorMessage.includes("IF NOT EXISTS") || errorMessage.includes("syntax")) {
        try {
          // Try creating without IF NOT EXISTS (will fail silently if exists)
          const constraintWithoutIfNotExists = constraint.replace(
            /IF NOT EXISTS\s+/gi,
            ""
          );
          await runQuery(constraintWithoutIfNotExists);
        } catch {
          // Ignore - constraint likely already exists
        }
      }
    }
  }

  // Create indexes for better query performance
  const indexes = [
    `CREATE INDEX user_platformRole_index IF NOT EXISTS
      FOR (u:User) ON (u.platformRole)`,
    
    `CREATE INDEX user_status_index IF NOT EXISTS
      FOR (u:User) ON (u.status)`,
    
    `CREATE INDEX event_startAt_index IF NOT EXISTS
      FOR (e:Event) ON (e.startAt)`,
    
    `CREATE INDEX event_status_index IF NOT EXISTS
      FOR (e:Event) ON (e.status)`,
    
    `CREATE INDEX rsvp_state_index IF NOT EXISTS
      FOR (r:RSVP) ON (r.state)`,
    
    `CREATE INDEX club_status_index IF NOT EXISTS
      FOR (c:Club) ON (c.status)`,
  ];

  for (const index of indexes) {
    try {
      await runQuery(index);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[DB Indexes] Could not create index: ${errorMessage}`);
      
      // If IF NOT EXISTS is not supported, try without it
      if (errorMessage.includes("IF NOT EXISTS") || errorMessage.includes("syntax")) {
        try {
          const indexWithoutIfNotExists = index.replace(/IF NOT EXISTS\s+/gi, "");
          await runQuery(indexWithoutIfNotExists);
        } catch {
          // Ignore - index likely already exists
        }
      }
    }
  }

  console.log("[DB Constraints] Database constraints and indexes ensured");
}

