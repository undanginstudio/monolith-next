/**
 * Orders Feature — Domain Types (V1.1)
 */
import type { OrderType, OrderStatus } from "@/server/schema/orders";
import type { TemplateCategory } from "@/server/schema/templates";

export type { OrderType, OrderStatus, TemplateCategory };

export interface OrderSummary {
  id: string;
  orderNumber: string;
  clientName: string;
  clientWhatsapp: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  totalPrice: string; // decimal returns as string from pg driver
  createdAt: Date;
}

export interface OrderDetail extends OrderSummary {
  templateId: string | null;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Generic discriminated union for all Order Server Action responses.
 * `fieldErrors` is optional — only present when Zod fails per-field validation.
 */
export type OrderActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<string, string>>;
    };

// ---------------------------------------------------------------------------
// Human-readable status labels (for UI display — safe to import from client)
// ---------------------------------------------------------------------------
export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  draft: "Draft",
  pending_payment: "Menunggu Pembayaran",
  payment_verified: "Pembayaran Terverifikasi",
  in_production: "Dalam Produksi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
} as const;

export const ORDER_TYPE_LABELS: Readonly<Record<OrderType, string>> = {
  digital_only: "Digital Only",
  digital_plus_physical: "Digital & Fisik",
} as const;
