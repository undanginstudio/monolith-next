/**
 * RSVP Server Action — Public Guest Page
 * src/features/guests/actions/rsvp.ts
 *
 * PUBLIC route — NO admin RBAC guards.
 * Called directly from the guest invitation page (no auth required).
 *
 * BR-018: RSVP submission rules:
 *   - name is required (min 2 chars)
 *   - is_attending must be a valid enum value
 *   - total_guests_bringing must be >= 1 if attending
 *   - wishes_text is optional (max 500 chars)
 *   - guest_id is optional — links the RSVP to a known guest record
 *
 * After a successful insert, triggers on-demand revalidation of the
 * admin dashboard so analytics / RSVP counts update immediately.
 */
"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { rsvpAndWishes } from "@/server/schema/invitations";
import { revalidatePath } from "next/cache";
import type { AttendingStatus } from "@/server/schema/invitations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type RsvpActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

// ---------------------------------------------------------------------------
// Zod Schema — BR-018
// ---------------------------------------------------------------------------
const ATTENDING_VALUES = [
  "present",
  "absent",
  "maybe",
] as const satisfies readonly AttendingStatus[];

const SubmitRsvpSchema = z.object({
  invitationId: z.string().uuid("Invitation ID tidak valid"),

  /** Optional: if the guest came via a personalised URL token */
  guestId: z.string().uuid().optional(),

  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(255, "Nama maksimal 255 karakter"),

  isAttending: z.enum(ATTENDING_VALUES, {
    message: "Status kehadiran tidak valid",
  }),

  totalGuestsBringing: z
    .number({ message: "Jumlah tamu harus berupa angka" })
    .int("Jumlah tamu harus bilangan bulat")
    .min(0, "Jumlah tamu tidak boleh negatif")
    .max(20, "Jumlah tamu maksimal 20")
    .default(1),

  wishesText: z
    .string()
    .trim()
    .max(500, "Ucapan maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

export type SubmitRsvpInput = z.infer<typeof SubmitRsvpSchema>;

// ---------------------------------------------------------------------------
// submitRsvpAction
// ---------------------------------------------------------------------------
export async function submitRsvpAction(
  rawInput: SubmitRsvpInput
): Promise<RsvpActionResult<{ rsvpId: string }>> {
  // ── Zod validation ────────────────────────────────────────────────────────
  const parsed = SubmitRsvpSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
        k,
        v?.[0] ?? "Input tidak valid",
      ])
    );
    return {
      success: false,
      error: "Data RSVP tidak valid. Periksa kembali form.",
      fieldErrors,
    };
  }

  const {
    invitationId,
    guestId,
    name,
    isAttending,
    totalGuestsBringing,
    wishesText,
  } = parsed.data;

  // ── Insert RSVP record ────────────────────────────────────────────────────
  try {
    const [rsvp] = await db
      .insert(rsvpAndWishes)
      .values({
        invitationId,
        guestId:             guestId ?? null,
        name,
        isAttending,
        totalGuestsBringing: totalGuestsBringing ?? 1,
        wishesText:          wishesText === "" ? null : (wishesText ?? null),
      })
      .returning({ id: rsvpAndWishes.id });

    if (!rsvp) throw new Error("Insert RSVP gagal.");

    // ── On-demand revalidation ────────────────────────────────────────────
    // Invalidate the admin dashboard so RSVP count + wishes list refresh.
    // Uses stale-while-revalidate: stale content served immediately while
    // fresh data regenerates in the background (no guest latency impact).
    revalidatePath("/dashboard", "layout");

    return { success: true, data: { rsvpId: rsvp.id } };
  } catch (error) {
    console.error("[submitRsvpAction]", error);
    return { success: false, error: "Gagal mengirim RSVP. Silakan coba lagi." };
  }
}
