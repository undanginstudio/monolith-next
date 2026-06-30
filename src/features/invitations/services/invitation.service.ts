/**
 * Invitations Feature — Service Layer (Infrastructure)
 * src/features/invitations/services/invitation.service.ts
 *
 * Pure DB query abstractions. No business logic.
 * All writes must go through Server Actions.
 */
import { db } from "@/server/db";
import {
  invitations,
  invitationEvents,
  invitationGalleries,
} from "@/server/schema/invitations";
import { orders } from "@/server/schema/orders";
import { eq } from "drizzle-orm";
import type {
  Invitation,
  InvitationEvent,
  InvitationGallery,
} from "@/server/schema/invitations";
import type { Order } from "@/server/schema/orders";

// ---------------------------------------------------------------------------
// Return shapes
// ---------------------------------------------------------------------------

export interface InvitationTree {
  invitation: Invitation;
  events: InvitationEvent[];
  galleries: InvitationGallery[];
}

// ---------------------------------------------------------------------------
// findOrderForInvitationInit
//
// Returns the minimal order fields needed for BR-006 enforcement.
// Checks that the order exists and is in 'payment_verified' status.
// ---------------------------------------------------------------------------
export async function findOrderForInvitationInit(
  orderId: string
): Promise<Pick<Order, "id" | "orderStatus"> | null> {
  const [order] = await db
    .select({ id: orders.id, orderStatus: orders.orderStatus })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order ?? null;
}

// ---------------------------------------------------------------------------
// findInvitationByOrderId
//
// Enforces the 1-to-1 constraint at the app layer before attempting insert.
// ---------------------------------------------------------------------------
export async function findInvitationByOrderId(
  orderId: string
): Promise<Pick<Invitation, "id"> | null> {
  const [inv] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(eq(invitations.orderId, orderId))
    .limit(1);

  return inv ?? null;
}

// ---------------------------------------------------------------------------
// findInvitationById
// ---------------------------------------------------------------------------
export async function findInvitationById(
  invitationId: string
): Promise<Invitation | null> {
  const [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  return inv ?? null;
}

// ---------------------------------------------------------------------------
// getInvitationTree
//
// Fetches the full invitation with all its events and galleries.
// Three parallel selects — faster than a JOIN for this 1-to-many shape.
// ---------------------------------------------------------------------------
export async function getInvitationTree(
  invitationId: string
): Promise<InvitationTree | null> {
  const [invRow] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invRow) return null;

  const [eventRows, galleryRows] = await Promise.all([
    db
      .select()
      .from(invitationEvents)
      .where(eq(invitationEvents.invitationId, invitationId))
      .orderBy(invitationEvents.date, invitationEvents.startTime),

    db
      .select()
      .from(invitationGalleries)
      .where(eq(invitationGalleries.invitationId, invitationId))
      .orderBy(invitationGalleries.sortOrder),
  ]);

  return {
    invitation: invRow,
    events: eventRows,
    galleries: galleryRows,
  };
}
