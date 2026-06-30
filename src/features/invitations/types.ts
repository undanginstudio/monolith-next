/**
 * Invitations Feature — Domain Types (V1.1)
 */
import type {
  Invitation,
  InvitationEvent,
  InvitationGallery,
} from "@/server/schema/invitations";
import type { InvitationTree } from "./services/invitation.service";

export type { Invitation, InvitationEvent, InvitationGallery, InvitationTree };

/** Application-layer status — not stored in DB; derived from isPublished field */
export type InvitationStatus = "draft" | "published";

export interface InvitationSummary {
  id: string;
  orderId: string;
  slug: string;
  title: string;
  isPublished: boolean;
  publishedAt: Date | null;
  guestCount: number;
  viewCount: number;
}

export interface CreateInvitationInput {
  orderId: string;
  slug: string;
  title: string;
  musicUrl?: string;
}

export interface UpdateInvitationInput {
  title?: string;
  musicUrl?: string;
  isPublished?: boolean;
}

/**
 * Generic discriminated union for all Invitation Server Action responses.
 * `fieldErrors` is optional — only present when Zod validation fails per-field.
 */
export type InvitationActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<string, string>>;
    };
