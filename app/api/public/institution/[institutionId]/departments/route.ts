import { NextResponse } from "next/server";
import { getAllInstitutionDepartments } from "@/lib/repos/institution";

/**
 * GET /api/public/institution/[institutionId]/departments
 * Public endpoint to get all departments for an institution (for registration forms)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ institutionId: string }> }
) {
  try {
    const { institutionId } = await params;
    
    if (!institutionId) {
      return NextResponse.json(
        { ok: false, error: "Institution ID is required" },
        { status: 400 }
      );
    }

    const departments = await getAllInstitutionDepartments(institutionId);

    return NextResponse.json({ ok: true, departments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

