/**
 * Orders Schema — Undangin.studio V1.1
 * Tables: orders, payments
 */
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { templates } from "./templates";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const orderTypeEnum = pgEnum("order_type", [
  "digital_only",
  "digital_plus_physical",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending_payment",
  "payment_verified",
  "in_production",
  "completed",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Table: orders
// ---------------------------------------------------------------------------
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * Human-readable invoice number: INV-202606-0001
   * Generated at application layer before insert.
   */
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientWhatsapp: varchar("client_whatsapp", { length: 20 }).notNull(),
  templateId: uuid("template_id").references(() => templates.id, {
    onDelete: "restrict",
  }),
  orderType: orderTypeEnum("order_type").notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  orderStatus: orderStatusEnum("order_status").notNull().default("draft"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Table: payments
// ---------------------------------------------------------------------------
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  bankDestination: varchar("bank_destination", { length: 50 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).notNull(),
  receiptImageUrl: varchar("receipt_image_url", { length: 2048 }).notNull(),
  verifiedBy: uuid("verified_by").references(() => users.id, {
    onDelete: "set null",
  }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const ordersRelations = relations(orders, ({ one, many }) => ({
  template: one(templates, {
    fields: [orders.templateId],
    references: [templates.id],
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  verifiedByUser: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// TypeScript inference
// ---------------------------------------------------------------------------
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type OrderType = (typeof orderTypeEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
