/**
 * Upstash Serverless Workflow Route Handler — WhatsApp Blast Queue
 * src/app/api/workflow/blast/route.ts
 *
 * Implements a serverless-friendly queue using `@upstash/workflow`.
 * Decouples message dispatching, retries, and database logging from
 * the trigger Server Action, executing asynchronously in the background.
 *
 * Steps:
 *   1. Context Fetching: SELECT core invitation parameters and guest details.
 *   2. BR-014 check: secondary safety verification that invitation isPublished.
 *   3. Loop Orchestration: For each guest:
 *       ├─ Construct personalized invitation message string.
 *       ├─ POST to third-party WhatsApp Gateway using process.env.WHATSAPP_GATEWAY_API_KEY.
 *       ├─ Record delivery status (sent / failed) and sentAt timestamp.
 *       └─ sleep for a randomized safe window (2 to 5 seconds) to prevent rate limits.
 */
import { serve } from "@upstash/workflow/nextjs";
import { db } from "@/server/db";
import { invitations, guests } from "@/server/schema/invitations";
import { eq, and, inArray } from "drizzle-orm";

interface BlastPayload {
  invitationId: string;
  guestIds: string[];
}

export const { POST } = serve<BlastPayload>(async (context) => {
  const { invitationId, guestIds } = context.requestPayload;

  // ── Step 1: Context Fetching ─────────────────────────────────────────────
  // Fetch details in a single cached execution block
  const ctx = await context.run("fetch-context", async () => {
    const [invitation] = await db
      .select({
        slug: invitations.slug,
        title: invitations.title,
        isPublished: invitations.isPublished,
      })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      throw new Error(`Invitation with ID ${invitationId} not found`);
    }

    // Retrieve all guest names, WhatsApp numbers, and unique slugs
    const selectedGuests = await db
      .select({
        id: guests.id,
        guestName: guests.guestName,
        guestWhatsapp: guests.guestWhatsapp,
        guestSlug: guests.guestSlug,
      })
      .from(guests)
      .where(
        and(
          eq(guests.invitationId, invitationId),
          inArray(guests.id, guestIds)
        )
      );

    return { invitation, guests: selectedGuests };
  });

  // ── Step 2: BR-014 Safety Check ──────────────────────────────────────────
  if (!ctx.invitation.isPublished) {
    throw new Error(
      `Invitation ${invitationId} is not published. WhatsApp blast aborted.`
    );
  }

  const gatewayUrl =
    process.env.WHATSAPP_GATEWAY_BASE_URL || "https://api.wa-gateway.com/send";
  const gatewayKey = process.env.WHATSAPP_GATEWAY_API_KEY;

  if (!gatewayKey) {
    throw new Error("WHATSAPP_GATEWAY_API_KEY is not configured on the server.");
  }

  // ── Step 3: Loop Orchestration with Rate Limiting ────────────────────────
  for (let i = 0; i < ctx.guests.length; i++) {
    const guest = ctx.guests[i]!;

    // Perform atomic gateway dispatch + DB record mutation per guest
    await context.run(`dispatch-blast-${guest.id}`, async () => {
      const appUrl =
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://undangin.studio";

      // Formulate unique personalized link
      const invitationUrl = `${appUrl}/u/${ctx.invitation.slug}?g=${guest.guestSlug}`;
      const message =
        `Dear ${guest.guestName},\n\n` +
        `Anda diundang ke acara *${ctx.invitation.title}*.\n` +
        `Silakan buka tautan undangan unik Anda di bawah ini:\n\n` +
        `${invitationUrl}\n\n` +
        `Kehadiran Anda adalah suatu kehormatan bagi kami. Terima kasih.`;

      try {
        const response = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${gatewayKey}`,
          },
          body: JSON.stringify({
            phone: guest.guestWhatsapp,
            message: message,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `WhatsApp gateway API returned error code ${response.status}`
          );
        }

        // Update DB status to 'sent'
        await db
          .update(guests)
          .set({
            whatsappBlastStatus: "sent",
            sentAt: new Date(),
          })
          .where(eq(guests.id, guest.id));

        return { success: true };
      } catch (err) {
        console.error(
          `[Workflow WA Blast] Failed to send to guest ${guest.id}:`,
          err
        );

        // Record status to 'failed'
        await db
          .update(guests)
          .set({
            whatsappBlastStatus: "failed",
            sentAt: new Date(),
          })
          .where(eq(guests.id, guest.id));

        throw err; // Throw to trigger QStash retry mechanism or mark step fail
      }
    });

    // To simulate human behavior and protect the sender's WhatsApp number,
    // apply a randomized sleep duration between 2 to 5 seconds.
    // context.sleep handles this cleanly without consuming serverless compute time.
    if (i < ctx.guests.length - 1) {
      const randomDelaySeconds = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, 5
      await context.sleep(`sleep-after-${guest.id}`, randomDelaySeconds);
    }
  }
});
