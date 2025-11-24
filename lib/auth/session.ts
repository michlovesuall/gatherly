import { cookies } from "next/headers";
import { runQuery } from "@/lib/neo4j";

export interface Session {
  userId: string;
  role: "student" | "employee" | "institution" | "super_admin" | "staff";
  institutionId: string;
  email: string;
  name: string;
}

/**
 * Get current session from cookie and validate with database
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    // Try user-based session first
    const result = await runQuery<{
      userId: string;
      role: string;
      institutionId: string;
      email: string;
      name: string;
    }>(
      `
      MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(u:User)
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(i:Institution)
      OPTIONAL MATCH (u)-[:MEMBER_OF_CLUB]->(c:Club)-[:BELONGS_TO]->(clubInst)
      WHERE (coalesce(clubInst.platformRole, "") = "institution" OR clubInst:Institution)
      WITH u, i, clubInst,
        CASE 
          WHEN u.platformRole = "institution" OR toLower(coalesce(u.platformRole, "")) = "institution" THEN coalesce(u.userId, "")
          WHEN i IS NOT NULL THEN COALESCE(i.userId, i.institutionId, "")
          WHEN clubInst IS NOT NULL THEN COALESCE(clubInst.userId, clubInst.institutionId, "")
          ELSE ""
        END AS institutionId,
        CASE 
          WHEN u.platformRole = "institution" OR toLower(coalesce(u.platformRole, "")) = "institution" THEN "institution"
          WHEN u.platformRole = "student" OR toLower(coalesce(u.platformRole, "")) = "student" THEN "student"
          WHEN u.platformRole = "employee" OR toLower(coalesce(u.platformRole, "")) = "employee" THEN "employee"
          WHEN u.platformRole = "super_admin" OR toLower(coalesce(u.platformRole, "")) = "super_admin" THEN "super_admin"
          ELSE "staff"
        END AS role
      RETURN u.userId AS userId, role, institutionId, u.email AS email, u.name AS name
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (result.length) {
      const user = result[0];
      return {
        userId: user.userId,
        role: user.role as Session["role"],
        institutionId: user.institutionId || "",
        email: user.email,
        name: user.name,
      };
    }

    // Fallback to institution session (User-labeled)
    const inst = await runQuery<{
      institutionId: string;
      institutionName: string;
    }>(
      `
      MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(i:User {platformRole: "institution"})
      RETURN i.userId AS institutionId,
             coalesce(i.name, "Institution") AS institutionName
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (inst.length) {
      const i = inst[0];
      return {
        userId: i.institutionId,
        role: "institution" as Session["role"],
        institutionId: i.institutionId,
        email: "",
        name: i.institutionName,
      };
    }

    // Legacy fallback: Institution-labeled node
    const instLegacy = await runQuery<{
      institutionId: string;
      institutionName: string;
    }>(
      `
      MATCH (s:Session {token: $token})<-[:HAS_SESSION]-(i:Institution)
      RETURN coalesce(i.userId, i.institutionId) AS institutionId,
             coalesce(i.name, i.institutionName, "Institution") AS institutionName
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (instLegacy.length) {
      const i = instLegacy[0];
      return {
        userId: i.institutionId,
        role: "institution" as Session["role"],
        institutionId: i.institutionId,
        email: "",
        name: i.institutionName,
      };
    }

    return null;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}
