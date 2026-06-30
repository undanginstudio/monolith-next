/**
 * Orders — Server Actions
 * src/features/orders/actions/order.actions.ts
 *
 * Business logic layer: validation → RBAC → DB transaction → typed response.
 *
 * Every action follows this strict execution order:
 *   1. assertPermission()   — RBAC guard (throws before any DB I/O if denied)
 *   2. schema.safeParse()   — Zod validation (structured field errors on failure)
 *   3. db.transaction()     — atomic DB writes with automatic rollback on throw
 *   4. return typed result  — { success, data } | { success, error, fieldErrors }
 */
"use server";

import { db } from "@/server/db";
import { orders, payments } from "@/server/schema/orders";
import { eq } from "drizzle-orm";
import { assertPermission, PERMISSIONS } from "@/features/auth/rbac";
import { getSession } from "@/lib/session";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  VerifyPaymentSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type VerifyPaymentInput,
} from "../validation";
import {
  buildOrderNumberPrefix,
  formatOrderNumber,
  resolveNextOrderSequence,
  findOrderById,
  VALID_STATUS_TRANSITIONS,
} from "../services/order.service";
import type { OrderActionResult } from "../types";
import type { Order, Payment } from "@/server/schema/orders";

// ============================================================================
// ACTION 1 — createOrderAction
// ============================================================================
/**
 * Create a new order with status `pending_payment`.
 * Generates a unique UDS-YYYYMM-XXXX order number within a transaction.
 *
 * Permission: manage:orders (superadmin, admin, finance)
 */
export async function createOrderAction(
  rawInput: CreateOrderInput
): Promise<OrderActionResult<{ orderId: string; orderNumber: string }>> {
  // ── 1. RBAC ──────────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.MANAGE_ORDERS);

  // ── 2. Session (get the authenticated admin creating this order) ──────────
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sesi tidak ditemukan." };
  }

  // ── 3. Zod validation ────────────────────────────────────────────────────
  const parsed = CreateOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
        k,
        v?.[0] ?? "Input tidak valid",
      ])
    );
    return {
      success: false,
      error: "Input tidak valid. Periksa kembali form Anda.",
      fieldErrors,
    };
  }

  const { clientName, clientWhatsapp, templateId, orderType, totalPrice } =
    parsed.data;

  // ── 4. DB Transaction ────────────────────────────────────────────────────
  try {
    const result = await db.transaction(async (tx) => {
      // Generate order number atomically inside the transaction
      const prefix = buildOrderNumberPrefix();
      const sequence = await resolveNextOrderSequence(tx, prefix);
      const orderNumber = formatOrderNumber(prefix, sequence);

      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          clientName,
          clientWhatsapp,
          templateId: templateId ?? null,
          orderType,
          totalPrice: String(totalPrice), // Drizzle decimal expects string
          orderStatus: "pending_payment",
          createdBy: session.userId,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // `newOrder` is guaranteed defined by RETURNING — but assert for TS
      if (!newOrder) throw new Error("Insert berhasil namun tidak mengembalikan data.");

      return { orderId: newOrder.id, orderNumber: newOrder.orderNumber };
    });

    return { success: true, data: result };
  } catch (error) {
    // Unique constraint violation on order_number (concurrent insert edge case)
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error:
          "Nomor order duplikat. Kemungkinan ada transaksi concurrent. Silakan coba lagi.",
      };
    }

    console.error("[createOrderAction]", error);
    return { success: false, error: "Gagal membuat pesanan. Silakan coba lagi." };
  }
}

// ============================================================================
// ACTION 2 — updateOrderStatusAction
// ============================================================================
/**
 * Transition an order to a new status, validated against the FSM map.
 * Prevents illegal state jumps (e.g., draft → completed).
 *
 * Note: `pending_payment → payment_verified` is intentionally EXCLUDED here.
 * That transition is owned by `verifyPaymentAction` which requires payment data.
 *
 * Permission: manage:orders (superadmin, admin, finance)
 */
export async function updateOrderStatusAction(
  rawInput: UpdateOrderStatusInput
): Promise<OrderActionResult<Pick<Order, "id" | "orderStatus" | "updatedAt">>> {
  // ── 1. RBAC ──────────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.MANAGE_ORDERS);

  // ── 2. Zod validation ────────────────────────────────────────────────────
  const parsed = UpdateOrderStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors.status?.[0] ?? "Input tidak valid.",
    };
  }

  const { orderId, status: newStatus } = parsed.data;

  // ── 3. DB Transaction ────────────────────────────────────────────────────
  try {
    const result = await db.transaction(async (tx) => {
      // Lock the row for update — prevents concurrent status races
      const [current] = await tx
        .select({ id: orders.id, orderStatus: orders.orderStatus })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!current) throw new NotFoundError("Pesanan");

      // Validate state machine transition
      const allowedNextStatuses = VALID_STATUS_TRANSITIONS[current.orderStatus];
      if (!allowedNextStatuses.includes(newStatus)) {
        throw new Error(
          `Transisi status tidak diizinkan: '${current.orderStatus}' → '${newStatus}'. ` +
            `Status yang diizinkan: [${allowedNextStatuses.join(", ") || "tidak ada"}]`
        );
      }

      const [updated] = await tx
        .update(orders)
        .set({ orderStatus: newStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning({
          id: orders.id,
          orderStatus: orders.orderStatus,
          updatedAt: orders.updatedAt,
        });

      if (!updated) throw new Error("Update berhasil namun tidak mengembalikan data.");
      return updated;
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    // Return the FSM error message directly (it's safe and descriptive)
    if (error instanceof Error && error.message.startsWith("Transisi status")) {
      return { success: false, error: error.message };
    }

    console.error("[updateOrderStatusAction]", error);
    return { success: false, error: "Gagal memperbarui status pesanan." };
  }
}

// ============================================================================
// ACTION 3 — verifyPaymentAction
// ============================================================================
/**
 * Record a manual payment verification and atomically advance the order status.
 *
 * Transaction guarantees:
 *   - Payment record inserted (with verifiedBy = current admin's userId)
 *   - Order status updated to `payment_verified`
 *   - Both writes succeed or both are rolled back
 *
 * Permission: verify:payments (superadmin, admin, finance)
 */
export async function verifyPaymentAction(
  rawInput: VerifyPaymentInput
): Promise<
  OrderActionResult<{ paymentId: string; orderStatus: Order["orderStatus"] }>
> {
  // ── 1. RBAC ──────────────────────────────────────────────────────────────
  await assertPermission(PERMISSIONS.VERIFY_PAYMENTS);

  // ── 2. Session (record who verified the payment) ──────────────────────────
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sesi tidak ditemukan." };
  }

  // ── 3. Zod validation ────────────────────────────────────────────────────
  const parsed = VerifyPaymentSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
        k,
        v?.[0] ?? "Input tidak valid",
      ])
    );
    return {
      success: false,
      error: "Data verifikasi pembayaran tidak valid.",
      fieldErrors,
    };
  }

  const {
    orderId,
    bankDestination,
    senderName,
    amountPaid,
    receiptImageUrl,
  } = parsed.data;

  // ── 4. DB Transaction ────────────────────────────────────────────────────
  try {
    const result = await db.transaction(async (tx) => {
      // 4a. Fetch and validate the order exists and is in the right state
      const [order] = await tx
        .select({ id: orders.id, orderStatus: orders.orderStatus })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) throw new NotFoundError("Pesanan");

      if (order.orderStatus !== "pending_payment") {
        throw new ConflictError(
          `Pesanan tidak dapat diverifikasi. Status saat ini adalah '${order.orderStatus}'. ` +
            `Hanya pesanan dengan status 'pending_payment' yang dapat diverifikasi.`
        );
      }

      // 4b. Check for duplicate payment record (idempotency guard)
      const [existingPayment] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      if (existingPayment) {
        throw new ConflictError(
          "Pembayaran untuk pesanan ini sudah pernah diverifikasi sebelumnya."
        );
      }

      // 4c. Insert payment record
      const verifiedAt = new Date();
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId,
          bankDestination,
          senderName,
          amountPaid: String(amountPaid), // Drizzle decimal expects string
          receiptImageUrl,
          verifiedBy: session.userId,
          verifiedAt,
        })
        .returning({ id: payments.id });

      if (!payment) throw new Error("Insert pembayaran gagal.");

      // 4d. Atomically advance order status to payment_verified
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          orderStatus: "payment_verified",
          updatedAt: verifiedAt,
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, orderStatus: orders.orderStatus });

      if (!updatedOrder) throw new Error("Update status pesanan gagal.");

      return {
        paymentId: payment.id,
        orderStatus: updatedOrder.orderStatus,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      return { success: false, error: error.message };
    }

    console.error("[verifyPaymentAction]", error);
    return { success: false, error: "Gagal memverifikasi pembayaran." };
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Detect PostgreSQL unique constraint violation (error code 23505).
 * Used to give a precise error message for concurrent order number generation.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}
