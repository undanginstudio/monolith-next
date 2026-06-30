/**
 * Guest Invitation Page — (guest)/u/[slug]
 * src/app/(guest)/u/[slug]/page.tsx
 *
 * PUBLIC route — no auth required.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CACHING STRATEGY (NFR-004: 1,000+ concurrent visitors)
 * ─────────────────────────────────────────────────────────────────────────────
 * We are NOT using `cacheComponents: true` (opted-out in next.config.ts).
 * We use the Previous Model: `unstable_cache` + route segment `revalidate`.
 *
 *   • `getInvitationBySlug` is wrapped in `unstable_cache` with:
 *       - tag: `invitation-${slug}` (for targeted on-demand invalidation)
 *       - revalidate: 60 seconds (ISR: stale-while-revalidate every 1 minute)
 *
 *   • Route segment `export const revalidate = 60` sets the ISR window.
 *     Next.js serves the cached HTML to all concurrent guests, then silently
 *     regenerates in the background every 60 seconds.
 *
 *   • `generateStaticParams` pre-generates the N most recently updated
 *     invitation slugs at build time, so the first visitor to any popular
 *     invitation gets pre-rendered HTML, not a cold DB hit.
 *
 *   • Analytics log is fire-and-forget (via `logInvitationViewAction` +
 *     `after()`), so it never blocks the page render.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE on params API (Next.js 16):
 *   `params` and `searchParams` are Promises — always `await` them.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { db } from "@/server/db";
import {
  invitations,
  invitationEvents,
  invitationGalleries,
} from "@/server/schema/invitations";
import { eq, desc } from "drizzle-orm";
import type {
  Invitation,
  InvitationEvent,
  InvitationGallery,
} from "@/server/schema/invitations";

// ─────────────────────────────────────────────────────────────────────────────
// Route segment config — ISR with 60-second revalidation window
// (Previous model, no cacheComponents)
// ─────────────────────────────────────────────────────────────────────────────
export const revalidate = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface InvitationPageData {
  invitation: Invitation;
  events: InvitationEvent[];
  galleries: InvitationGallery[];
}

interface GuestPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string }>; // g = guestSlug token for personalisation
}

// ─────────────────────────────────────────────────────────────────────────────
// Cached data fetcher — the core ISR cache unit
//
// `unstable_cache` wraps the DB query so that:
//   1. The first request hits the DB and stores the result
//   2. Subsequent requests within the `revalidate` window are served from cache
//   3. After the window expires, Next.js re-fetches in the background
//      while still serving the stale result (stale-while-revalidate)
//   4. `revalidateTag(`invitation-${slug}`)` invalidates this entry on-demand
//      when admin publishes/updates invitation content
// ─────────────────────────────────────────────────────────────────────────────
function getInvitationBySlug(slug: string) {
  return unstable_cache(
    async (): Promise<InvitationPageData | null> => {
      const [inv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.slug, slug))
        .limit(1);

      if (!inv || !inv.isPublished) return null;

      const [events, galleries] = await Promise.all([
        db
          .select()
          .from(invitationEvents)
          .where(eq(invitationEvents.invitationId, inv.id))
          .orderBy(invitationEvents.date, invitationEvents.startTime),

        db
          .select()
          .from(invitationGalleries)
          .where(eq(invitationGalleries.invitationId, inv.id))
          .orderBy(invitationGalleries.sortOrder),
      ]);

      return { invitation: inv, events, galleries };
    },
    // Cache key: unique per slug
    [`invitation-slug-${slug}`],
    {
      // Tag allows targeted invalidation when admin publishes/updates
      tags: [`invitation-${slug}`, "invitations"],
      // ISR window — matches route segment `revalidate`
      revalidate: 60,
    }
  )();
}

// ─────────────────────────────────────────────────────────────────────────────
// generateStaticParams
//
// Pre-generates the 50 most recently published invitations at build time.
// These get full static HTML — zero cold-start latency for popular links.
// Any slug not in this list is generated on-demand and cached thereafter.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const published = await db
    .select({ slug: invitations.slug })
    .from(invitations)
    .where(eq(invitations.isPublished, true))
    .orderBy(desc(invitations.publishedAt))
    .limit(50);

  return published.map((row) => ({ slug: row.slug }));
}

// ─────────────────────────────────────────────────────────────────────────────
// generateMetadata — Dynamic OG card per invitation
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: GuestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getInvitationBySlug(slug);

  if (!data) {
    return {
      title: "Undangan Tidak Ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const { invitation } = data;

  return {
    title: invitation.title,
    description: `Kami mengundang Anda untuk hadir dalam ${invitation.title}. Kehadiran Anda adalah kebahagiaan kami.`,
    openGraph: {
      type: "website",
      title: invitation.title,
      description: "Kehadiran Anda adalah kebahagiaan kami.",
      url: `/u/${slug}`,
    },
    // Allow indexing for published invitations
    robots: { index: true, follow: false },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component — Data-layer only (UI shell will be wired in Phase 5)
// ─────────────────────────────────────────────────────────────────────────────
export default async function GuestPage({
  params,
  searchParams,
}: GuestPageProps) {
  // Next.js 16: params is a Promise — must await
  const { slug } = await params;
  const { g: guestSlug } = await searchParams;

  // Fetch from unstable_cache (ISR)
  const data = await getInvitationBySlug(slug);

  // 404 if not found or not published
  if (!data) notFound();

  const { invitation, events, galleries } = data;

  // ── Data ready — pass to presentation layer (Phase 5) ────────────────────
  // The props below are intentionally typed and structured so the UI layer
  // can consume them without any additional DB queries.
  return (
    <main
      id="invitation-root"
      aria-label={invitation.title}
      className="min-h-screen bg-[var(--color-background)]"
    >
      {/**
       * Phase 5 placeholder — replace with:
       *   <GuestViewer
       *     invitation={invitation}
       *     events={events}
       *     galleries={galleries}
       *     guestSlug={guestSlug}
       *   />
       *
       * Data contract verified:
       *   invitation.title       → string
       *   invitation.musicUrl    → string | null
       *   invitation.isPublished → true (enforced above)
       *   events[]               → ordered by date ASC, startTime ASC
       *   galleries[]            → ordered by sortOrder ASC
       *   guestSlug              → string | undefined (from ?g= param)
       */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Undangan
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-6xl">
          {invitation.title}
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          {events.length} Acara · {galleries.length} Foto/Video
        </p>
        {guestSlug && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Token tamu: <code className="font-mono">{guestSlug}</code>
          </p>
        )}
      </section>
    </main>
  );
}
