/**
 * Invitation Server Actions — RBAC Guard Usage Example
 * src/features/invitations/actions/invitation.actions.ts
 *
 * Demonstrates how `assertPermission` is used as the FIRST line of every
 * protected Server Action — before any DB I/O or business logic executes.
 *
 * Security contract:
 *   - If the user is unauthenticated → throws UnauthorizedError
 *   - If the user lacks the permission → throws ForbiddenError
 *   - The calling client must handle these with try/catch or a wrapper
 */
"use server";

import { db } from "@/server/db";
import { invitations } from "@/server/schema/invitations";
import { eq } from "drizzle-orm";
import {
  assertPermission,
  PERMISSIONS,
} from "@/features/auth/rbac";
import { NotFoundError } from "@/lib/errors";
import type { InvitationActionResult } from "../types";

// ---------------------------------------------------------------------------
// publishInvitationAction
//
// Only 'superadmin' and 'admin' may publish.
// A 'finance' user calling this action will hit ForbiddenError at line 1,
// before any DB query executes.
// ---------------------------------------------------------------------------
export async function publishInvitationAction(
  invitationId: string
): Promise<InvitationActionResult<{ slug: string }>> {
  // ✅ GUARD — must be the very first statement
  await assertPermission(PERMISSIONS.PRODUCE_INVITATIONS);

  const [invitation] = await db
    .select({ id: invitations.id, slug: invitations.slug, isPublished: invitations.isPublished })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    throw new NotFoundError("Undangan");
  }

  if (invitation.isPublished) {
    return { success: false, error: "Undangan sudah dipublikasi sebelumnya." };
  }

  await db
    .update(invitations)
    .set({ isPublished: true, publishedAt: new Date() })
    .where(eq(invitations.id, invitationId));

  return { success: true, data: { slug: invitation.slug } };
}

// ---------------------------------------------------------------------------
// unpublishInvitationAction — same permission requirement
// ---------------------------------------------------------------------------
export async function unpublishInvitationAction(
  invitationId: string
): Promise<InvitationActionResult<void>> {
  await assertPermission(PERMISSIONS.PRODUCE_INVITATIONS);

  await db
    .update(invitations)
    .set({ isPublished: false, publishedAt: null })
    .where(eq(invitations.id, invitationId));

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// deleteInvitationAction — 'superadmin' only (cascade deletes all child rows)
// ---------------------------------------------------------------------------
export async function deleteInvitationAction(
  invitationId: string
): Promise<InvitationActionResult<void>> {
  await assertPermission(PERMISSIONS.MANAGE_USERS); // superadmin only

  await db.delete(invitations).where(eq(invitations.id, invitationId));

  return { success: true, data: undefined };
}
