/**
 * Guests Feature — Domain Types (V1.1)
 * Aligned with the V1.1 invitations schema column names.
 */
import type { BlastStatus, AttendingStatus } from "@/server/schema/invitations";

export type { BlastStatus, AttendingStatus };

export interface GuestRow {
  id: string;
  invitationId: string;
  guestName: string;
  guestWhatsapp: string;
  guestSlug: string;
  whatsappBlastStatus: BlastStatus;
  sentAt: Date | null;
}

export interface CreateGuestInput {
  invitationId: string;
  guestName: string;
  guestWhatsapp: string;
}

export interface BulkCreateGuestInput {
  invitationId: string;
  guests: Omit<CreateGuestInput, "invitationId">[];
}

export interface GuestStats {
  total: number;
  blastSent: number;
  blastPending: number;
  blastFailed: number;
}

export interface BlastJobPayload {
  guestId: string;
  invitationId: string;
  whatsappNumber: string;
  guestName: string;
  invitationUrl: string;
  messageTemplate: string;
}

export type GuestActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
