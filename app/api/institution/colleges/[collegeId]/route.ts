import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * DELETE /api/institution/colleges/[collegeId]
 * Delete a college
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "institution") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const institutionId = session.institutionId || session.userId;
    const { collegeId } = await params;

    // Verify college belongs to institution
    const collegeCheck = await runQuery<{ logo?: string; exists: boolean }>(
      `
      MATCH (c:College {collegeId: $collegeId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN c.logo AS logo, COUNT(c) > 0 AS exists
      LIMIT 1
      `,
      { collegeId, institutionId }
    );

    if (!collegeCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "College not found" },
        { status: 404 }
      );
    }

    // Delete logo file if exists
    const logo = collegeCheck[0]?.logo;
    if (logo && logo.startsWith("/uploads/colleges/")) {
      const filepath = join(process.cwd(), "public", logo);
      if (existsSync(filepath)) {
        try {
          await unlink(filepath);
        } catch (e) {
          // Log but don't fail if file deletion fails
          console.error("Failed to delete logo file:", e);
        }
      }
    }

    // Delete college and all relationships
    await runQuery(
      `
      MATCH (c:College {collegeId: $collegeId})
      DETACH DELETE c
      `,
      { collegeId }
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

