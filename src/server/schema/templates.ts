/**
 * Templates Schema — Undangin.studio V1.1
 * Table: templates (catalog of available invitation templates)
 */
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const templateCategoryEnum = pgEnum("template_category", [
  "basic",
  "premium",
]);

export const templateEventTypeEnum = pgEnum("template_event_type", [
  "wedding",
  "engagement",
  "khitan",
  "aqiqah",
]);

// ---------------------------------------------------------------------------
// Table: templates
// ---------------------------------------------------------------------------
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * Human-readable template code: e.g. W-BASIC-01, E-PREMIUM-05
   * W = Wedding, E = Engagement/Lamaran, K = Khitanan, A = Aqiqah
   */
  templateCode: varchar("template_code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: templateCategoryEnum("category").notNull(),
  eventType: templateEventTypeEnum("event_type").notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 2048 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// TypeScript inference
// ---------------------------------------------------------------------------
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateCategory = (typeof templateCategoryEnum.enumValues)[number];
export type TemplateEventType = (typeof templateEventTypeEnum.enumValues)[number];
