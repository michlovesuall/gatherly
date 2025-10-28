import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { ensureSuperAdmin } from "@/lib/auth/ensure-super-admin";
import neo4j from "neo4j-driver";

export async function GET() {
  // Ensure super admin exists on health hits in dev/boot
  try {
    await ensureSuperAdmin({ hardenExisting: true });
  } catch {
    // ignore seeding errors on health check
  }
  const envVars = {
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    NEO4J_DB: process.env.NEO4J_DB,
  };
  console.log("[DB Health] Loaded env vars:", envVars);

  try {
    const rows = await runQuery<{ ok: unknown }>("RETURN 1 AS ok");
    const db = process.env.NEO4J_DB ?? "(default)";
    console.log("[DB Health] Neo4j query response:", rows);

    let okValue = rows?.[0]?.ok;
    if (
      neo4j.isInt &&
      okValue &&
      typeof okValue === "object" &&
      neo4j.isInt(okValue)
    ) {
      okValue = okValue.toNumber();
    }

    return NextResponse.json({
      status: okValue === 1 ? "up" : "unknown",
      database: db,
      debug: { envVars, rows },
    });
  } catch (err) {
    // Safely extract error message
    const errorMsg =
      err && typeof err === "object" && "message" in err
        ? (err as { message?: string }).message
        : String(err);
    console.error("[DB Health] Error:", err);
    return NextResponse.json(
      {
        status: "down",
        error: errorMsg,
        debug: { envVars },
      },
      { status: 500 }
    );
  }
}
