/**
 * Guests Feature — Service Layer (V1.1)
 * Direct DB queries aligned with V1.1 guest schema.
 */
import { db } from "@/server/db";
import { guests } from "@/server/schema/invitations";
import { eq, and } from "drizzle-orm";
import type { GuestRow } from "../types";

export async function getGuestsByInvitationId(
  invitationId: string
): Promise<GuestRow[]> {
  return db
    .select()
    .from(guests)
    .where(eq(guests.invitationId, invitationId))
    .orderBy(guests.guestName);
}

export async function getGuestBySlug(guestSlug: string): Promise<GuestRow | null> {
  const [guest] = await db
    .select()
    .from(guests)
    .where(eq(guests.guestSlug, guestSlug))
    .limit(1);

  return guest ?? null;
}

export async function verifyGuestSlug(
  guestSlug: string,
  invitationId: string
): Promise<boolean> {
  const [guest] = await db
    .select({ id: guests.id })
    .from(guests)
    .where(and(eq(guests.guestSlug, guestSlug), eq(guests.invitationId, invitationId)))
    .limit(1);

  return Boolean(guest);
}
