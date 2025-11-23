import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { getSession } from "@/lib/auth/session";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

async function saveLogoFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), "public", "uploads", "clubs");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);
  return `/uploads/clubs/${filename}`;
}

async function deleteLogoFile(logoUrl: string): Promise<void> {
  if (logoUrl && logoUrl.startsWith("/uploads/clubs/")) {
    const filepath = join(process.cwd(), "public", logoUrl);
    if (existsSync(filepath)) {
      try {
        await unlink(filepath);
      } catch (e) {
        console.error("Failed to delete logo file:", e);
      }
    }
  }
}

export async function PATCH(
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

    if (session.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { clubId } = await params;

    // Verify user is president (officer) of the club
    const userCheck = await runQuery<{
      isPresident: boolean;
      currentLogo?: string;
    }>(
      `
      MATCH (u:User {userId: $userId})-[mc:MEMBER_OF_CLUB {role: "officer"}]->(c:Club {clubId: $clubId})
      RETURN 
        COUNT(mc) > 0 AS isPresident,
        c.logo AS currentLogo
      `,
      { userId: session.userId, clubId }
    );

    const check = userCheck[0];
    if (!check?.isPresident) {
      return NextResponse.json(
        { ok: false, error: "You are not authorized to update this club" },
        { status: 403 }
      );
    }

    // Handle FormData
    const formData = await req.formData();
    const clubName = formData.get("clubName")?.toString() || "";
    const clubAcronym = formData.get("clubAcronym")?.toString() || "";
    const logoFile = formData.get("logo") as File | null;

    if (!clubName.trim()) {
      return NextResponse.json(
        { ok: false, error: "Club name is required" },
        { status: 400 }
      );
    }

    let logoUrl: string | null = check.currentLogo || null;

    // Handle logo upload
    if (logoFile && logoFile.size > 0) {
      // Delete old logo if exists
      if (check.currentLogo) {
        await deleteLogoFile(check.currentLogo);
      }
      // Save new logo
      logoUrl = await saveLogoFile(logoFile);
    }

    const now = new Date().toISOString();

    // Update club
    const result = await runQuery<{
      clubId: string;
      name: string;
      clubName: string;
      acronym?: string;
      logo?: string;
    }>(
      `
      MATCH (c:Club {clubId: $clubId})
      SET c.name = $clubName,
          c.clubName = $clubName,
          c.acronym = $clubAcronym,
          c.clubAcr = $clubAcronym,
          c.logo = $logoUrl,
          c.updatedAt = $now,
          c.updated_at = $now
      RETURN c.clubId AS clubId, c.name AS name, c.clubName AS clubName, c.acronym AS acronym, c.logo AS logo
      `,
      { clubId, clubName: clubName.trim(), clubAcronym: clubAcronym.trim() || null, logoUrl, now }
    );

    if (!result.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to update club" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Club settings updated successfully",
      club: {
        clubId: result[0].clubId,
        clubName: result[0].clubName,
        acronym: result[0].acronym,
        logo: result[0].logo,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

