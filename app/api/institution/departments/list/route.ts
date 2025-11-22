import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAllInstitutionDepartments } from "@/lib/repos/institution";

/**
 * GET /api/institution/departments/list
 * Get all departments for dropdown selection
 */
export async function GET(req: Request) {
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
    const departments = await getAllInstitutionDepartments(institutionId);

    return NextResponse.json({ ok: true, departments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

