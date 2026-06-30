/**
 * Trigger WhatsApp Blast Action — Undangin.studio
 * src/features/guests/actions/blast.ts
 *
 * Checks permission and triggers the Upstash Workflow.
 */
"use server";

import { db } from "@/server/db";
import { invitations } from "@/server/schema/invitations";
import { eq } from "drizzle-orm";
import { assertPermission, PERMISSIONS } from "@/features/auth/rbac";
import { workflowClient } from "@/lib/upstash";
import type { GuestActionResult } from "../types";

export async function triggerInvitationBlastAction(
  invitationId: string,
  guestIds: string[]
): Promise<GuestActionResult<{ workflowRunId: string }>> {
  // ── 1. RBAC Guard ────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.DISTRIBUTE_BLAST);

  // ── 2. Input Validation ──────────────────────────────────────────────────
  if (!invitationId || !guestIds || guestIds.length === 0) {
    return { success: false, error: "Invitation ID dan daftar penerima wajib diisi." };
  }

  // ── 3. BR-014 check: check if published ──────────────────────────────────
  const [invitation] = await db
    .select({ isPublished: invitations.isPublished })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    return { success: false, error: "Undangan tidak ditemukan." };
  }

  if (!invitation.isPublished) {
    return {
      success: false,
      error: "WhatsApp Blast hanya dapat dikirimkan untuk undangan yang sudah dipublikasikan (Published).",
    };
  }

  // ── 4. Trigger Upstash Workflow ──────────────────────────────────────────
  try {
    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://undangin.studio";
    
    // Construct full URL of our workflow endpoint
    const url = `${appUrl}/api/workflow/blast`;

    const { workflowRunId } = await workflowClient.trigger({
      url,
      body: {
        invitationId,
        guestIds,
      },
    });

    return { success: true, data: { workflowRunId } };
  } catch (error) {
    console.error("[triggerInvitationBlastAction] Trigger Error:", error);
    return {
      success: false,
      error: "Gagal menjadwalkan pengiriman WhatsApp blast. Silakan coba beberapa saat lagi.",
    };
  }
}
