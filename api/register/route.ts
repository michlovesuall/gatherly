import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();

  if (
    !data.institutionName ||
    !data.institutionEmail ||
    !data.institutionPassword
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
