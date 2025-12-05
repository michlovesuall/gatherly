import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runQuery } from "@/lib/neo4j";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow students and employees to RSVP
    if (session.role !== "student" && session.role !== "employee" && session.role !== "staff") {
      return NextResponse.json(
        { ok: false, error: "Only students and employees can RSVP to events" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const body = await req.json();
    const { state } = body;

    // Validate state
    if (state !== null && state !== "going" && state !== "interested") {
      return NextResponse.json(
        { ok: false, error: "Invalid RSVP state. Must be 'going', 'interested', or null" },
        { status: 400 }
      );
    }

    // Check if event exists
    const eventCheck = await runQuery<{ exists: boolean }>(
      `
      MATCH (e:Event {eventId: $eventId})
      RETURN e IS NOT NULL AS exists
      LIMIT 1
      `,
      { eventId }
    );

    if (!eventCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (state === null) {
      // Delete RSVP: Remove all relationships first, then delete the node
      await runQuery(
        `
        MATCH (u:User {userId: $userId})-[r1:RSVP]->(rsvp:RSVP)-[r2:FOR]->(e:Event {eventId: $eventId})
        DELETE r1, r2
        WITH rsvp
        WHERE NOT (rsvp)<-[:RSVP]-() AND NOT (rsvp)-[:FOR]->()
        DELETE rsvp
        `,
        { userId: session.userId, eventId }
      );
    } else {
      // Create or update RSVP state using MERGE
      // Use a unique identifier for the RSVP node based on user-event pair
      const rsvpKey = `${session.userId}-${eventId}`;
      await runQuery(
        `
        MATCH (u:User {userId: $userId})
        MATCH (e:Event {eventId: $eventId})
        MERGE (rsvp:RSVP {rsvpKey: $rsvpKey})
        ON CREATE SET 
          rsvp.rsvpId = $rsvpId,
          rsvp.state = $state,
          rsvp.createdAt = $now,
          rsvp.updatedAt = $now
        ON MATCH SET 
          rsvp.state = $state,
          rsvp.updatedAt = $now
        MERGE (u)-[:RSVP]->(rsvp)
        MERGE (rsvp)-[:FOR]->(e)
        `,
        { 
          userId: session.userId, 
          eventId, 
          rsvpKey,
          rsvpId: randomUUID(), 
          state, 
          now 
        }
      );
    }

    // Get updated counts
    const countsResult = await runQuery<{
      going: number;
      interested: number;
      checkedIn: number;
    }>(
      `
      MATCH (e:Event {eventId: $eventId})
      OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
      OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
      OPTIONAL MATCH (checkedInUser:User)-[:CHECKED_IN]->(e)
      RETURN 
        COUNT(DISTINCT goingUser) AS going,
        COUNT(DISTINCT interestedUser) AS interested,
        COUNT(DISTINCT checkedInUser) AS checkedIn
      `,
      { eventId }
    );

    const counts = countsResult[0] || { going: 0, interested: 0, checkedIn: 0 };

    return NextResponse.json({
      ok: true,
      state: state,
      counts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[RSVP POST Error]:", msg);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow students and employees to remove RSVP
    if (session.role !== "student" && session.role !== "employee" && session.role !== "staff") {
      return NextResponse.json(
        { ok: false, error: "Only students and employees can remove RSVP" },
        { status: 403 }
      );
    }

    const { eventId } = await params;

    // Delete RSVP: Remove all relationships first, then delete the node
    await runQuery(
      `
      MATCH (u:User {userId: $userId})-[r1:RSVP]->(rsvp:RSVP)-[r2:FOR]->(e:Event {eventId: $eventId})
      DELETE r1, r2
      WITH rsvp
      WHERE NOT (rsvp)<-[:RSVP]-() AND NOT (rsvp)-[:FOR]->()
      DELETE rsvp
      `,
      { userId: session.userId, eventId }
    );

    // Get updated counts
    const countsResult = await runQuery<{
      going: number;
      interested: number;
      checkedIn: number;
    }>(
      `
      MATCH (e:Event {eventId: $eventId})
      OPTIONAL MATCH (goingUser:User)-[:RSVP]->(goingRSVP:RSVP {state: "going"})-[:FOR]->(e)
      OPTIONAL MATCH (interestedUser:User)-[:RSVP]->(interestedRSVP:RSVP {state: "interested"})-[:FOR]->(e)
      OPTIONAL MATCH (checkedInUser:User)-[:CHECKED_IN]->(e)
      RETURN 
        COUNT(DISTINCT goingUser) AS going,
        COUNT(DISTINCT interestedUser) AS interested,
        COUNT(DISTINCT checkedInUser) AS checkedIn
      `,
      { eventId }
    );

    const counts = countsResult[0] || { going: 0, interested: 0, checkedIn: 0 };

    return NextResponse.json({
      ok: true,
      state: null,
      counts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[RSVP DELETE Error]:", msg);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}

