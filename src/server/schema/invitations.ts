/**
 * Invitations Schema — Undangin.studio V1.1
 * Tables: invitations, invitation_events, invitation_galleries,
 *         physical_invitation_details, guests, rsvp_and_wishes
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const mediaTypeEnum = pgEnum("media_type", ["image", "video_link"]);

export const vendorStatusEnum = pgEnum("vendor_status", [
  "desain",
  "cetak",
  "finishing",
  "dikirim",
]);

export const blastStatusEnum = pgEnum("blast_status", [
  "pending",
  "sent",
  "failed",
]);

export const attendingStatusEnum = pgEnum("attending_status", [
  "present",
  "absent",
  "maybe",
]);

// ---------------------------------------------------------------------------
// Table: invitations
// ---------------------------------------------------------------------------
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  /** URL path segment: e.g. budi-dan-ani → /u/budi-dan-ani */
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  musicUrl: varchar("music_url", { length: 2048 }),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Table: invitation_events (multi-event per invitation)
// ---------------------------------------------------------------------------
export const invitationEvents = pgTable("invitation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  eventName: varchar("event_name", { length: 100 }).notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  /** Can be a specific time like "22:00" or descriptive text like "Selesai" */
  endTime: varchar("end_time", { length: 20 }),
  timezone: varchar("timezone", { length: 10 }),
  placeName: varchar("place_name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  mapsUrl: text("maps_url"),
});

// ---------------------------------------------------------------------------
// Table: invitation_galleries
// ---------------------------------------------------------------------------
export const invitationGalleries = pgTable("invitation_galleries", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  mediaType: mediaTypeEnum("media_type").notNull(),
  mediaUrl: varchar("media_url", { length: 2048 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Table: physical_invitation_details (conditional — only for "Digital & Fisik")
// ---------------------------------------------------------------------------
export const physicalInvitationDetails = pgTable("physical_invitation_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  totalQuantity: integer("total_quantity").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  vendorStatus: vendorStatusEnum("vendor_status").notNull().default("desain"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
});

// ---------------------------------------------------------------------------
// Table: guests
// ---------------------------------------------------------------------------
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  guestWhatsapp: varchar("guest_whatsapp", { length: 20 }).notNull(),
  /**
   * Short unique token appended to personalize the invitation URL.
   * e.g. /u/budi-dan-ani?g=abc123
   */
  guestSlug: varchar("guest_slug", { length: 64 }).notNull(),
  whatsappBlastStatus: blastStatusEnum("whatsapp_blast_status")
    .notNull()
    .default("pending"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Table: rsvp_and_wishes
// ---------------------------------------------------------------------------
export const rsvpAndWishes = pgTable("rsvp_and_wishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  /** Nullable: anonymous guests may submit without a guest record */
  guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  isAttending: attendingStatusEnum("is_attending"),
  totalGuestsBringing: integer("total_guests_bringing").notNull().default(1),
  wishesText: text("wishes_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  order: one(orders, { fields: [invitations.orderId], references: [orders.id] }),
  events: many(invitationEvents),
  galleries: many(invitationGalleries),
  guests: many(guests),
  rsvpAndWishes: many(rsvpAndWishes),
}));

export const invitationEventsRelations = relations(invitationEvents, ({ one }) => ({
  invitation: one(invitations, {
    fields: [invitationEvents.invitationId],
    references: [invitations.id],
  }),
}));

export const invitationGalleriesRelations = relations(
  invitationGalleries,
  ({ one }) => ({
    invitation: one(invitations, {
      fields: [invitationGalleries.invitationId],
      references: [invitations.id],
    }),
  })
);

export const physicalInvitationDetailsRelations = relations(
  physicalInvitationDetails,
  ({ one }) => ({
    order: one(orders, {
      fields: [physicalInvitationDetails.orderId],
      references: [orders.id],
    }),
  })
);

export const guestsRelations = relations(guests, ({ one, many }) => ({
  invitation: one(invitations, {
    fields: [guests.invitationId],
    references: [invitations.id],
  }),
  rsvpAndWishes: many(rsvpAndWishes),
}));

export const rsvpAndWishesRelations = relations(rsvpAndWishes, ({ one }) => ({
  invitation: one(invitations, {
    fields: [rsvpAndWishes.invitationId],
    references: [invitations.id],
  }),
  guest: one(guests, {
    fields: [rsvpAndWishes.guestId],
    references: [guests.id],
  }),
}));

// ---------------------------------------------------------------------------
// TypeScript inference
// ---------------------------------------------------------------------------
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type InvitationEvent = typeof invitationEvents.$inferSelect;
export type NewInvitationEvent = typeof invitationEvents.$inferInsert;
export type InvitationGallery = typeof invitationGalleries.$inferSelect;
export type NewInvitationGallery = typeof invitationGalleries.$inferInsert;
export type PhysicalInvitationDetail = typeof physicalInvitationDetails.$inferSelect;
export type NewPhysicalInvitationDetail = typeof physicalInvitationDetails.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
export type RsvpAndWish = typeof rsvpAndWishes.$inferSelect;
export type NewRsvpAndWish = typeof rsvpAndWishes.$inferInsert;
export type BlastStatus = (typeof blastStatusEnum.enumValues)[number];
export type AttendingStatus = (typeof attendingStatusEnum.enumValues)[number];
