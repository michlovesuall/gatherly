import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { runQuery } from "@/lib/neo4j";
import { randomUUID } from "crypto";
import { ensureSuperAdmin } from "@/lib/auth/ensure-super-admin";

function makeSessionToken() {
  return randomUUID();
}

export async function POST(req: Request) {
  try {
    // Ensure a protected super_admin exists (no-op if present)
    await ensureSuperAdmin({ hardenExisting: true });
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const cypher = `
      MATCH (u:User {email: $email})
      RETURN {
      userId: u.userId,
      name: u.name,
      email: u.email,
      hashedPassword: u.hashedPassword,
      platformRole: u.platformRole,
      status: u.status
      } AS user
      LIMIT 1
    `;
    const rows = await runQuery<{
      user: {
        userId: string;
        name: string;
        email: string;
        hashedPassword: string;
        platformRole: string;
        status: string;
      };
    }>(cypher, { email });

    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "Account do not exist" },
        { status: 401 }
      );
    }

    const user = rows[0].user;

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        { ok: false, error: "Account is not active" },
        { status: 403 }
      );
    }

    const token = makeSessionToken();

    // Persist Session node in Neo4j
    await runQuery(
      `
      MATCH (u:User {userId: $userId})
      CREATE (s:Session {token: $token, createdAt: datetime()})
      MERGE (u)-[:HAS_SESSION]->(s)
    `,
      { userId: user.userId, token }
    );

    const res = NextResponse.json({
      ok: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
      },
    });

    res.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
