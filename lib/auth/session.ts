import { cookies } from "next/headers";
import { runQuery } from "@/lib/neo4j";

export interface Session {
  userId: string;
  role:
    | "student"
    | "employee"
    | "admin"
    | "institution"
    | "super_admin"
    | "staff";
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
    const result = await runQuery<{
      userId: string;
      role: string;
      institutionId: string;
      email: string;
      name: string;
    }>(
      `
      MATCH (u:User)
      WHERE EXISTS {
        (u)-[:HAS_SESSION]->(s:Session {token: $token})
      }
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(i:Institution)
      WITH u, i,
        COALESCE(i.institutionId, "") AS institutionId,
        CASE 
          WHEN u.platformRole = "student" THEN "student"
          WHEN u.platformRole = "employee" THEN "employee"
          WHEN u.platformRole = "admin" THEN "admin"
          WHEN u.platformRole = "super_admin" THEN "super_admin"
          WHEN u.platformRole = "institution" THEN "institution"
          ELSE "staff"
        END AS role
      RETURN u.userId AS userId, role, institutionId, u.email AS email, u.name AS name
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (!result.length) {
      return null;
    }

    const user = result[0];
    return {
      userId: user.userId,
      role: user.role as Session["role"],
      institutionId: user.institutionId || "",
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}
