/**
 * Analytics Schema — Undangin.studio V1.1
 * Table: invitation_analytics (visit log for dashboard statistics)
 */
import {
  pgTable,
  bigserial,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { invitations } from "./invitations";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const deviceTypeEnum = pgEnum("device_type", [
  "mobile",
  "tablet",
  "desktop",
]);

// ---------------------------------------------------------------------------
// Table: invitation_analytics
// Uses bigserial (auto-increment bigint) as PK — high insert volume table.
// ---------------------------------------------------------------------------
export const invitationAnalytics = pgTable("invitation_analytics", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  deviceType: deviceTypeEnum("device_type"),
  browserName: varchar("browser_name", { length: 100 }),
  clickedMaps: boolean("clicked_maps").notNull().default(false),
  visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const invitationAnalyticsRelations = relations(
  invitationAnalytics,
  ({ one }) => ({
    invitation: one(invitations, {
      fields: [invitationAnalytics.invitationId],
      references: [invitations.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// TypeScript inference
// ---------------------------------------------------------------------------
export type InvitationAnalytic = typeof invitationAnalytics.$inferSelect;
export type NewInvitationAnalytic = typeof invitationAnalytics.$inferInsert;
export type DeviceType = (typeof deviceTypeEnum.enumValues)[number];
