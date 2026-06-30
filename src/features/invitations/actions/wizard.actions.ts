/**
 * Invitation Wizard — Server Actions
 * src/features/invitations/actions/wizard.actions.ts
 *
 * Business logic for the invitation wizard builder.
 * Execution contract per action:
 *   1. assertPermission()     — RBAC guard (throws before any I/O if denied)
 *   2. Zod safeParse()        — structured field-level validation
 *   3. Business rule checks   — domain invariants (BR-006, slug uniqueness, etc.)
 *   4. db.transaction()       — atomic multi-table writes with auto rollback
 *   5. Return typed result    — { success, data } | { success, error, fieldErrors }
 */
"use server";

import { db } from "@/server/db";
import {
  invitations,
  invitationEvents,
  invitationGalleries,
} from "@/server/schema/invitations";
import { eq } from "drizzle-orm";
import { assertPermission, PERMISSIONS } from "@/features/auth/rbac";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  InitializeInvitationSchema,
  SaveWizardSchema,
  type InitializeInvitationInput,
  type SaveWizardInput,
} from "../validation";
import {
  findOrderForInvitationInit,
  findInvitationByOrderId,
  findInvitationById,
  getInvitationTree,
  type InvitationTree,
} from "../services/invitation.service";
import type { InvitationActionResult } from "../types";

// ============================================================================
// ACTION 1 — initializeInvitationAction
// ============================================================================
/**
 * BR-006: An invitation can ONLY be created when the linked order has
 * `payment_verified` status. Enforced before any DB write.
 *
 * Also guards the 1-to-1 constraint (one order → one invitation) at the
 * app layer, in addition to the DB unique constraint on `order_id`.
 *
 * Permission: produce:invitations (superadmin, admin)
 */
export async function initializeInvitationAction(
  rawInput: InitializeInvitationInput
): Promise<InvitationActionResult<{ invitationId: string; slug: string }>> {
  // ── 1. RBAC ──────────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.PRODUCE_INVITATIONS);

  // ── 2. Zod validation ────────────────────────────────────────────────────
  const parsed = InitializeInvitationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
        k,
        v?.[0] ?? "Input tidak valid",
      ])
    );
    return { success: false, error: "Input tidak valid.", fieldErrors };
  }

  const { orderId, slug } = parsed.data;

  // ── 3. Business rules ────────────────────────────────────────────────────
  // BR-006: Order must be payment_verified
  const order = await findOrderForInvitationInit(orderId);
  if (!order) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }
  if (order.orderStatus !== "payment_verified") {
    return {
      success: false,
      error: `Undangan hanya bisa dibuat setelah pembayaran terverifikasi. Status pesanan saat ini: '${order.orderStatus}'.`,
    };
  }

  // Guard: one order → one invitation
  const existing = await findInvitationByOrderId(orderId);
  if (existing) {
    return {
      success: false,
      error: "Pesanan ini sudah memiliki undangan yang terdaftar.",
    };
  }

  // ── 4. DB insert ─────────────────────────────────────────────────────────
  try {
    const [newInv] = await db
      .insert(invitations)
      .values({
        orderId,
        slug,
        // Title placeholder — will be updated via saveWizardDataAction
        title: `Draft Undangan — ${slug}`,
        isPublished: false,
      })
      .returning({ id: invitations.id, slug: invitations.slug });

    if (!newInv) throw new Error("Insert berhasil namun tidak mengembalikan data.");

    return { success: true, data: { invitationId: newInv.id, slug: newInv.slug } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: "Slug sudah digunakan oleh undangan lain. Gunakan slug yang berbeda.",
        fieldErrors: { slug: "Slug sudah dipakai." },
      };
    }
    console.error("[initializeInvitationAction]", error);
    return { success: false, error: "Gagal membuat undangan. Silakan coba lagi." };
  }
}

// ============================================================================
// ACTION 2 — saveWizardDataAction
// ============================================================================
/**
 * Full wizard save: atomically updates invitation core info, wipes + re-inserts
 * events, and wipes + re-inserts galleries in a single transaction.
 *
 * Wipe-and-replace pattern is intentional:
 *   - Events can be reordered, renamed, or deleted mid-wizard
 *   - Galleries have explicit `sort_order` managed by the frontend
 *   - The entire snapshot is always consistent after a successful save
 *
 * Permission: produce:invitations (superadmin, admin)
 */
export async function saveWizardDataAction(
  invitationId: string,
  rawInput: SaveWizardInput
): Promise<
  InvitationActionResult<{
    invitationId: string;
    eventsCount: number;
    galleriesCount: number;
  }>
> {
  // ── 1. RBAC ──────────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.PRODUCE_INVITATIONS);

  // ── 2. Validate invitationId ─────────────────────────────────────────────
  if (!invitationId || !/^[0-9a-f-]{36}$/.test(invitationId)) {
    return { success: false, error: "Invitation ID tidak valid." };
  }

  // ── 3. Zod validation ────────────────────────────────────────────────────
  const parsed = SaveWizardSchema.safeParse(rawInput);
  if (!parsed.success) {
    // Flatten nested array errors into a readable map
    const flat = parsed.error.flatten();
    const fieldErrors: Record<string, string> = {};

    // Top-level field errors
    for (const [k, msgs] of Object.entries(flat.fieldErrors)) {
      fieldErrors[k] = msgs?.[0] ?? "Input tidak valid";
    }
    // Nested form errors (e.g., events[0].eventName)
    for (const msg of flat.formErrors) {
      fieldErrors["_form"] = msg;
    }

    return {
      success: false,
      error: "Data wizard tidak valid. Periksa kembali semua field.",
      fieldErrors,
    };
  }

  const { title, musicUrl, events, galleries } = parsed.data;

  // ── 4. Business rule: invitation must exist ───────────────────────────────
  const invitation = await findInvitationById(invitationId);
  if (!invitation) throw new NotFoundError("Undangan");

  // ── 5. DB Transaction — atomic multi-table wipe + reinsert ───────────────
  try {
    const result = await db.transaction(async (tx) => {
      // 5a. Update invitation core fields
      await tx
        .update(invitations)
        .set({
          title,
          musicUrl: musicUrl ?? null,
        })
        .where(eq(invitations.id, invitationId));

      // 5b. Wipe old events, re-insert new batch
      await tx
        .delete(invitationEvents)
        .where(eq(invitationEvents.invitationId, invitationId));

      await tx.insert(invitationEvents).values(
        events.map((e) => ({
          invitationId,
          eventName:  e.eventName,
          date:       e.date,       // stored as string 'YYYY-MM-DD' — pg date column
          startTime:  e.startTime,  // stored as string 'HH:MM' — pg time column
          endTime:    e.endTime   ?? null,
          timezone:   e.timezone  ?? null,
          placeName:  e.placeName,
          address:    e.address,
          mapsUrl:    e.mapsUrl === "" ? null : (e.mapsUrl ?? null),
        }))
      );

      // 5c. Wipe old galleries, re-insert new batch (empty array = no insert)
      await tx
        .delete(invitationGalleries)
        .where(eq(invitationGalleries.invitationId, invitationId));

      if (galleries.length > 0) {
        await tx.insert(invitationGalleries).values(
          galleries.map((g, index) => ({
            invitationId,
            mediaType:  g.mediaType,
            mediaUrl:   g.mediaUrl,
            sortOrder:  g.sortOrder ?? index, // fallback to insertion order
          }))
        );
      }

      return {
        invitationId,
        eventsCount:   events.length,
        galleriesCount: galleries.length,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    console.error("[saveWizardDataAction]", error);
    return { success: false, error: "Gagal menyimpan data wizard. Silakan coba lagi." };
  }
}

// ============================================================================
// ACTION 3 — getInvitationDetailsAction
// ============================================================================
/**
 * Fetches the full invitation tree:
 *   - Invitation core fields
 *   - Events (ordered by date ASC, startTime ASC)
 *   - Galleries (ordered by sortOrder ASC)
 *
 * Consumed by the wizard form on mount to pre-populate all fields.
 *
 * Permission: produce:invitations (superadmin, admin)
 */
export async function getInvitationDetailsAction(
  invitationId: string
): Promise<InvitationActionResult<InvitationTree>> {
  // ── 1. RBAC ──────────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.PRODUCE_INVITATIONS);

  if (!invitationId || !/^[0-9a-f-]{36}$/.test(invitationId)) {
    return { success: false, error: "Invitation ID tidak valid." };
  }

  try {
    const tree = await getInvitationTree(invitationId);

    if (!tree) {
      return { success: false, error: "Undangan tidak ditemukan." };
    }

    return { success: true, data: tree };
  } catch (error) {
    console.error("[getInvitationDetailsAction]", error);
    return { success: false, error: "Gagal mengambil data undangan." };
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}
