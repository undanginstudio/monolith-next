/**
 * Guests Feature — Server Actions (V1.1)
 * Aligned with V1.1 schema: guestName, guestWhatsapp, guestSlug, whatsappBlastStatus
 */
"use server";

import { db } from "@/server/db";
import { guests } from "@/server/schema/invitations";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { CreateGuestInput, GuestActionResult, GuestStats } from "../types";

function generateGuestSlug(): string {
  return randomBytes(6).toString("base64url"); // 8-char URL-safe slug
}

export async function createGuest(
  input: CreateGuestInput
): Promise<GuestActionResult<{ id: string; guestSlug: string }>> {
  try {
    const guestSlug = generateGuestSlug();

    const [guest] = await db
      .insert(guests)
      .values({
        invitationId: input.invitationId,
        guestName: input.guestName,
        guestWhatsapp: input.guestWhatsapp,
        guestSlug,
      })
      .returning({ id: guests.id, guestSlug: guests.guestSlug });

    return { success: true, data: { id: guest.id, guestSlug: guest.guestSlug } };
  } catch (error) {
    console.error("[createGuest]", error);
    return { success: false, error: "Gagal menambahkan tamu." };
  }
}

export async function getGuestStats(
  invitationId: string
): Promise<GuestActionResult<GuestStats>> {
  try {
    const rows = await db
      .select({ whatsappBlastStatus: guests.whatsappBlastStatus })
      .from(guests)
      .where(eq(guests.invitationId, invitationId));

    const stats: GuestStats = {
      total: rows.length,
      blastSent: rows.filter((g) => g.whatsappBlastStatus === "sent").length,
      blastPending: rows.filter((g) => g.whatsappBlastStatus === "pending").length,
      blastFailed: rows.filter((g) => g.whatsappBlastStatus === "failed").length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("[getGuestStats]", error);
    return { success: false, error: "Gagal mengambil statistik tamu." };
  }
}
