/**
 * Orders Feature — Service Layer (Infrastructure)
 * src/features/orders/services/order.service.ts
 *
 * Pure DB query abstractions. No business logic.
 * Called only by Server Actions — never directly from UI.
 */
import { db } from "@/server/db";
import { orders } from "@/server/schema/orders";
import { like, desc, eq } from "drizzle-orm";
import type { OrderStatus } from "@/server/schema/orders";
import type { PgDatabase } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Order number generation
//
// Format: UDS-YYYYMM-XXXX  (e.g. UDS-202606-0001)
//
// Strategy: within a transaction, find the highest sequence for the current
// month via ORDER BY DESC LIMIT 1. The unique constraint on `order_number`
// acts as the final safety net against concurrent duplicates.
// ---------------------------------------------------------------------------
export function buildOrderNumberPrefix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `UDS-${year}${month}-`;
}

export function formatOrderNumber(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(4, "0")}`;
}

/**
 * Resolves the next sequence number for the current month.
 * MUST be called inside a Drizzle transaction to be meaningful.
 */
export async function resolveNextOrderSequence(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: PgDatabase<any, any, any>,
  prefix: string
): Promise<number> {
  const [last] = await tx
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(like(orders.orderNumber, `${prefix}%`))
    .orderBy(desc(orders.orderNumber))
    .limit(1);

  if (!last) return 1;

  // Extract the trailing 4-digit sequence: "UDS-202606-0007" → 7
  const parts = last.orderNumber.split("-");
  const lastSeq = parseInt(parts[parts.length - 1]!, 10);
  return isNaN(lastSeq) ? 1 : lastSeq + 1;
}

// ---------------------------------------------------------------------------
// Fetch an order by ID — returns null if not found
// ---------------------------------------------------------------------------
export async function findOrderById(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order ?? null;
}

// ---------------------------------------------------------------------------
// State transition validation map
//
// Defines which status values a given status can legally transition TO.
// updateOrderStatusAction uses this to prevent illegal jumps.
// verifyPaymentAction bypasses this — it owns the verified transition itself.
// ---------------------------------------------------------------------------
export const VALID_STATUS_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["cancelled"], // Verified only via verifyPaymentAction
  payment_verified: ["in_production", "cancelled"],
  in_production: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};
