import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runQuery } from "@/lib/neo4j";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { user: null },
      { status: 200 }
    );
  }

  try {
    const result = await runQuery<{
      userId: string;
      name: string;
      email: string;
      role: string;
      avatarUrl?: string;
    }>(
      `
      MATCH (s:Session {token: $token})
      MATCH (u:User)-[:HAS_SESSION]->(s)
      RETURN u.userId AS userId,
             u.name AS name,
             u.email AS email,
             u.platformRole AS role,
             u.avatarUrl AS avatarUrl
      LIMIT 1
      `,
      { token: sessionToken }
    );

    if (!result.length) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    const user = result[0];
    return NextResponse.json({
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { user: null },
      { status: 200 }
    );
  }
}

