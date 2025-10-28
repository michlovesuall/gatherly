import { runQuery } from "@/lib/neo4j";

export type ProtectedCheckTarget = {
  userId?: string;
  email?: string;
};

/**
 * Throws an error if the target user is a protected super_admin and the attempted mutation is not allowed.
 * - Disallow delete of the node entirely
 * - Disallow changing platformRole away from super_admin
 * - Disallow setting status to anything other than active
 * - Disallow removing or changing email unless revalidated via re-auth (must pass allowEmailChange=true)
 */
export async function assertProtectedSuperAdminMutation(
  target: ProtectedCheckTarget,
  proposedChanges: {
    deleteNode?: boolean;
    newPlatformRole?: string | undefined;
    newStatus?: string | undefined;
    newEmail?: string | null | undefined;
    /** Only set to true if you have validated the actor through a fresh re-auth flow */
    allowEmailChange?: boolean;
  }
): Promise<void> {
  const rows = await runQuery<{
    isProtected: boolean;
    role: string;
    email: string | null;
  }>(
    `
    MATCH (u:User)
    WHERE ($userId IS NOT NULL AND u.userId = $userId)
       OR ($email IS NOT NULL AND u.email = $email)
    RETURN coalesce(u.isProtected, false) AS isProtected,
           coalesce(u.platformRole, "student") AS role,
           coalesce(u.email, null) AS email
    LIMIT 1
    `,
    { userId: target.userId ?? null, email: target.email ?? null }
  );

  if (!rows.length) return; // no target found; upstream should handle 404
  const info = rows[0];
  const isProtected = !!info.isProtected && info.role === "super_admin";
  if (!isProtected) return;

  if (proposedChanges.deleteNode) {
    throw new Error(
      "Operation not permitted: cannot delete protected super_admin"
    );
  }

  if (
    proposedChanges.newPlatformRole &&
    proposedChanges.newPlatformRole !== "super_admin"
  ) {
    throw new Error(
      "Operation not permitted: cannot change platformRole of protected super_admin"
    );
  }

  if (
    proposedChanges.newStatus &&
    proposedChanges.newStatus.toLowerCase() !== "active"
  ) {
    throw new Error(
      "Operation not permitted: cannot set status of protected super_admin to non-active"
    );
  }

  if (
    proposedChanges.newEmail !== undefined &&
    proposedChanges.newEmail !== info.email &&
    !proposedChanges.allowEmailChange
  ) {
    throw new Error(
      "Operation not permitted: email change for protected super_admin requires re-auth"
    );
  }
}

/**
 * Returns true if the given userId/email points to a protected super_admin.
 */
export async function isProtectedSuperAdmin(
  target: ProtectedCheckTarget
): Promise<boolean> {
  const rows = await runQuery<{
    isProtected: boolean;
    role: string;
  }>(
    `
    MATCH (u:User)
    WHERE ($userId IS NOT NULL AND u.userId = $userId)
       OR ($email IS NOT NULL AND u.email = $email)
    RETURN coalesce(u.isProtected, false) AS isProtected,
           coalesce(u.platformRole, "student") AS role
    LIMIT 1
    `,
    { userId: target.userId ?? null, email: target.email ?? null }
  );
  if (!rows.length) return false;
  return !!rows[0].isProtected && rows[0].role === "super_admin";
}
