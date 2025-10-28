import { runQuery } from "@/lib/neo4j";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

type EnsureOptions = {
  /**
   * If true, we will update an existing super_admin to set isProtected=true and status="active"
   * without changing core identity fields (email, name, etc.).
   */
  hardenExisting?: boolean;
};

/**
 * Ensure there is a protected super_admin account from day 0.
 * Reads identity from environment variables if creation is needed:
 * - SUPER_ADMIN_EMAIL (required to create)
 * - SUPER_ADMIN_PASSWORD (required to create if SUPER_ADMIN_PASSWORD_HASH not provided)
 * - SUPER_ADMIN_PASSWORD_HASH (optional; if present, used as-is)
 * - SUPER_ADMIN_NAME (optional; defaults to "Super Admin")
 * - SUPER_ADMIN_PHONE (optional)
 * - SUPER_ADMIN_AVATAR_URL (optional)
 */
export async function ensureSuperAdmin(
  options: EnsureOptions = {}
): Promise<void> {
  // Quick existence check
  const existing = await runQuery<{
    userId: string;
    isProtected?: boolean;
    status?: string;
  }>(
    `
    MATCH (u:User {platformRole: "super_admin"})
    RETURN u.userId AS userId, coalesce(u.isProtected, false) AS isProtected, coalesce(u.status, "active") AS status
    LIMIT 1
    `
  );

  if (existing.length) {
    // Optionally harden existing super_admin
    const needsHarden =
      options.hardenExisting &&
      (!existing[0].isProtected || existing[0].status !== "active");
    if (needsHarden) {
      await runQuery(
        `
        MATCH (u:User {userId: $userId})
        SET u.isProtected = true,
            u.status = "active",
            u.updatedAt = datetime().toString()
        `,
        { userId: existing[0].userId }
      );
    }
    return;
  }

  // Create if missing, using ENV
  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";
  const phone = process.env.SUPER_ADMIN_PHONE?.trim() || "";
  const avatarUrl = process.env.SUPER_ADMIN_AVATAR_URL?.trim() || null;
  const passwordHashEnv = process.env.SUPER_ADMIN_PASSWORD_HASH?.trim();
  const passwordPlain = process.env.SUPER_ADMIN_PASSWORD?.trim();

  if (!email) {
    // Not enough info to create a super admin; skip silently
    return;
  }

  let hashedPassword = passwordHashEnv || "";
  if (!hashedPassword) {
    if (!passwordPlain) {
      // Not enough info to create; skip
      return;
    }
    hashedPassword = await bcrypt.hash(passwordPlain, 12);
  }

  const now = new Date().toISOString();
  const userId = randomUUID();

  // Avoid duplicate email
  const dup = await runQuery<{ ok?: number }>(
    `
    MATCH (u:User {email: $email})
    RETURN 1 AS ok
    LIMIT 1
    `,
    { email }
  );
  if (dup.length) {
    // Email already exists; do not create a conflicting user.
    return;
  }

  await runQuery(
    `
    CREATE (u:User {
      userId: $userId,
      name: $name,
      idNumber: $idNumber,
      email: $email,
      phone: $phone,
      hashedPassword: $hashedPassword,
      avatarUrl: $avatarUrl,
      platformRole: "super_admin",
      status: "active",
      isProtected: true,
      createdAt: $now,
      updatedAt: $now
    })
    `,
    {
      userId,
      name,
      idNumber: null,
      email,
      phone,
      hashedPassword,
      avatarUrl,
      now,
    }
  );
}

export default ensureSuperAdmin;
