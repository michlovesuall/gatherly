import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { runQuery } from "@/lib/neo4j";
import { randomUUID } from "crypto";

function makeSessionToken() {
  return randomUUID();
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: "Institution email and password are required",
        },
        { status: 400 }
      );
    }

    const cypher = `
      MATCH (i:User {platformRole: "institution"})
      WHERE toLower(i.email) = toLower($email)
      RETURN {
        institutionId: i.userId,
        institutionName: i.name,
        hashedPassword: i.hashedPassword,
        status: coalesce(i.status, "active"),
        platformRole: "institution"
      } AS inst
      LIMIT 1
    `;

    const rows = await runQuery<{
      inst: {
        institutionId: string;
        institutionName: string;
        hashedPassword: string;
        status: string;
        platformRole: string;
      };
    }>(cypher, { email });

    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "Institution account does not exist" },
        { status: 401 }
      );
    }

    const inst = rows[0].inst;
    const ok = await bcrypt.compare(password, inst.hashedPassword);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid institution credentials" },
        { status: 401 }
      );
    }

    if (
      inst.status &&
      !["approved", "active"].includes(inst.status.toLowerCase())
    ) {
      return NextResponse.json(
        { ok: false, error: "Institution account is not approved" },
        { status: 403 }
      );
    }

    const token = makeSessionToken();

    // Persist Session node for institution entity (User-labeled node)
    await runQuery(
      `
      MATCH (i:User {userId: $institutionId, platformRole: "institution"})
      CREATE (s:Session {token: $token, createdAt: datetime()})
      MERGE (i)-[:HAS_SESSION]->(s)
    `,
      { institutionId: inst.institutionId, token }
    );

    const res = NextResponse.json({
      ok: true,
      user: {
        userId: inst.institutionId,
        name: inst.institutionName,
        email,
        platformRole: "institution",
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
