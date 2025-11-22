import { NextResponse } from "next/server";
import { getAllInstitutionColleges } from "@/lib/repos/institution";

/**
 * GET /api/public/institution/[institutionId]/colleges
 * Public endpoint to get all colleges for an institution (for registration forms)
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

    const colleges = await getAllInstitutionColleges(institutionId);

    return NextResponse.json({ ok: true, colleges });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

