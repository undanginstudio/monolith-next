/**
 * Orders Feature — Zod Validation Schemas
 * src/features/orders/validation.ts
 *
 * Written for Zod v4 API (message: '', not errorMap/invalid_type_error).
 */
import { z } from "zod";
import type { OrderStatus, OrderType } from "@/server/schema/orders";

// ---------------------------------------------------------------------------
// Shared field validators
// ---------------------------------------------------------------------------
const whatsappNumber = z
  .string()
  .trim()
  .min(9, "Nomor WhatsApp minimal 9 digit")
  .max(15, "Nomor WhatsApp maksimal 15 digit")
  .regex(
    /^(?:\+62|62|0)[0-9]{8,13}$/,
    "Format nomor WhatsApp tidak valid (contoh: 08123456789)"
  );

// Zod v4: use { message } not { invalid_type_error }
const rupiah = z
  .number({ message: "Harga harus berupa angka" })
  .positive("Harga harus lebih dari 0")
  .max(999_999_999_999, "Harga melebihi batas maksimum");

// ---------------------------------------------------------------------------
// ORDER TYPE enum — Zod v4: z.enum() takes a tuple directly, no options object
// ---------------------------------------------------------------------------
const ORDER_TYPES = ["digital_only", "digital_plus_physical"] as const satisfies readonly OrderType[];
const orderTypeSchema = z.enum(ORDER_TYPES);

// ---------------------------------------------------------------------------
// ORDER STATUS enum
// ---------------------------------------------------------------------------
const ORDER_STATUSES = [
  "draft",
  "pending_payment",
  "payment_verified",
  "in_production",
  "completed",
  "cancelled",
] as const satisfies readonly OrderStatus[];
const orderStatusSchema = z.enum(ORDER_STATUSES);

// ---------------------------------------------------------------------------
// 1. CreateOrderSchema
// ---------------------------------------------------------------------------
export const CreateOrderSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, "Nama klien minimal 2 karakter")
    .max(255, "Nama klien maksimal 255 karakter"),

  clientWhatsapp: whatsappNumber,

  templateId: z
    .string()
    .uuid("Template ID harus berupa UUID yang valid")
    .optional(),

  orderType: orderTypeSchema,

  totalPrice: rupiah,
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ---------------------------------------------------------------------------
// 2. UpdateOrderStatusSchema
// ---------------------------------------------------------------------------
export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Order ID harus berupa UUID yang valid"),
  status: orderStatusSchema,
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ---------------------------------------------------------------------------
// 3. VerifyPaymentSchema
// ---------------------------------------------------------------------------
export const VerifyPaymentSchema = z.object({
  orderId: z.string().uuid("Order ID harus berupa UUID yang valid"),

  bankDestination: z
    .string()
    .trim()
    .min(2, "Nama bank tujuan wajib diisi")
    .max(50, "Nama bank tujuan maksimal 50 karakter"),

  senderName: z
    .string()
    .trim()
    .min(2, "Nama pengirim minimal 2 karakter")
    .max(255, "Nama pengirim maksimal 255 karakter"),

  amountPaid: rupiah,

  receiptImageUrl: z
    .string()
    .trim()
    .url("URL bukti transfer harus berupa URL yang valid")
    .max(2048, "URL terlalu panjang"),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
