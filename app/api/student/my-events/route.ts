import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMyEvents } from "@/lib/repos/student";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow students and employees
    if (session.role !== "student" && session.role !== "employee" && session.role !== "staff") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const events = await getMyEvents(session.userId);

    return NextResponse.json({
      ok: true,
      events,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[My Events GET Error]:", msg);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}

