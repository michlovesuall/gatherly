import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAllInstitutionColleges } from "@/lib/repos/institution";

/**
 * GET /api/institution/colleges/list
 * Get all colleges for dropdown selection
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
    const colleges = await getAllInstitutionColleges(institutionId);

    return NextResponse.json({ ok: true, colleges });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

