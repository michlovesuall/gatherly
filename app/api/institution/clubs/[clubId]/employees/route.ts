import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getInstitutionEmployeesForClubAdvisor } from "@/lib/repos/institution";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
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

    const { clubId } = await params;
    const institutionId = session.institutionId || session.userId;

    // Get search query from URL
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search") || undefined;

    // Fetch employees who are not advisors for this club
    const employees = await getInstitutionEmployeesForClubAdvisor(
      institutionId,
      clubId,
      searchQuery
    );

    return NextResponse.json({
      ok: true,
      employees,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

