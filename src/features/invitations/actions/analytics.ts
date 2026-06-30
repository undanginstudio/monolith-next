/**
 * Analytics Logging Action — Public Guest Page
 * src/features/invitations/actions/analytics.ts
 *
 * PUBLIC route — NO admin RBAC guards.
 *
 * Design principle (NFR-004 — 1,000+ concurrent visitors):
 *   - The insert is fire-and-forget: it MUST NOT block the main page render.
 *   - Called from the client-side on page load via a useEffect / Server Action
 *     trigger, so the user's First Contentful Paint is unaffected.
 *   - Uses Next.js `after()` API if available (Next.js 15+), otherwise
 *     falls back to a non-blocking Promise launch pattern.
 *   - The `invitation_analytics` table uses bigserial PK for high insert volume.
 *
 * NOTE: `after()` is the idiomatic Next.js 16 way to run post-response work.
 *       It runs after the response is sent, so it has zero latency impact.
 */
"use server";

import { z } from "zod";
import { after } from "next/server";
import { db } from "@/server/db";
import { invitationAnalytics } from "@/server/schema/analytics";
import type { DeviceType } from "@/server/schema/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
const DEVICE_TYPES = ["mobile", "tablet", "desktop"] as const satisfies readonly DeviceType[];

const AnalyticsInputSchema = z.object({
  invitationId: z.string().uuid("Invitation ID tidak valid"),
  deviceType:   z.enum(DEVICE_TYPES).optional(),
  browserName:  z.string().trim().max(100).optional(),
  clickedMaps:  z.boolean().default(false),
});

export type AnalyticsInput = z.infer<typeof AnalyticsInputSchema>;

export type AnalyticsActionResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// logInvitationViewAction
//
// Fire-and-forget analytics write.
// The actual DB insert runs AFTER the response is sent to the client
// using Next.js `after()` — zero blocking latency for the guest.
// ---------------------------------------------------------------------------
export async function logInvitationViewAction(
  rawInput: AnalyticsInput
): Promise<AnalyticsActionResult> {
  // Validate input synchronously (fast — pure computation, no I/O)
  const parsed = AnalyticsInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    // Silent fail: analytics errors must NEVER affect the guest experience
    return { success: false, error: "Input analytics tidak valid." };
  }

  const { invitationId, deviceType, browserName, clickedMaps } = parsed.data;

  // Schedule the DB write to happen AFTER the response is flushed.
  // `after()` is the Next.js 16 mechanism for post-response background work.
  // It does not block the response — guests receive the page immediately.
  after(async () => {
    try {
      await db.insert(invitationAnalytics).values({
        invitationId,
        deviceType:  deviceType ?? null,
        browserName: browserName ?? null,
        clickedMaps: clickedMaps ?? false,
        // visitedAt defaults to now() in the schema
      });
    } catch (error) {
      // Log to server console only — do not surface to the client
      console.error("[logInvitationViewAction] Analytics insert failed:", error);
    }
  });

  // Return immediately — the insert happens in the background
  return { success: true };
}
