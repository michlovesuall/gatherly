import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * DELETE /api/institution/departments/[departmentId]
 * Delete a department
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ departmentId: string }> }
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
    const { departmentId } = await params;

    // Verify department belongs to institution
    const deptCheck = await runQuery<{ logo?: string; exists: boolean }>(
      `
      MATCH (d:Department {departmentId: $departmentId})-[:BELONGS_TO]->(i)
      WHERE (i.userId = $institutionId OR i.institutionId = $institutionId)
        AND (coalesce(i.platformRole, "") = "institution" OR i:Institution)
      RETURN d.logo AS logo, COUNT(d) > 0 AS exists
      LIMIT 1
      `,
      { departmentId, institutionId }
    );

    if (!deptCheck[0]?.exists) {
      return NextResponse.json(
        { ok: false, error: "Department not found" },
        { status: 404 }
      );
    }

    // Delete logo file if exists
    const logo = deptCheck[0]?.logo;
    if (logo && logo.startsWith("/uploads/departments/")) {
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

    // Delete department and all relationships
    await runQuery(
      `
      MATCH (d:Department {departmentId: $departmentId})
      DETACH DELETE d
      `,
      { departmentId }
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

