import { NextResponse } from "next/server";
import { getAllInstitutionPrograms } from "@/lib/repos/institution";

/**
 * GET /api/public/institution/[institutionId]/programs
 * Public endpoint to get all programs for an institution (for registration forms)
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

    const programs = await getAllInstitutionPrograms(institutionId);

    return NextResponse.json({ ok: true, programs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

