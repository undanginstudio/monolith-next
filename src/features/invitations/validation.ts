/**
 * Invitations Feature — Zod Validation Schemas
 * src/features/invitations/validation.ts
 *
 * Written for Zod v4. All enums match DB enum values exactly (lowercase).
 */
import { z } from "zod";
import { mediaTypeEnum } from "@/server/schema/invitations";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** ISO date string — YYYY-MM-DD */
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD (contoh: 2025-08-17)");

/** Time string — HH:MM (24-hour) */
const timeHHMM = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Format waktu harus HH:MM (contoh: 09:00)");

/** URL-safe slug: lowercase letters, numbers, hyphens; no leading/trailing hyphens */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug minimal 3 karakter")
  .max(100, "Slug maksimal 100 karakter")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-). Tidak boleh diawali atau diakhiri dengan tanda hubung."
  );

// ---------------------------------------------------------------------------
// 1. InitializeInvitationSchema
// ---------------------------------------------------------------------------
export const InitializeInvitationSchema = z.object({
  orderId: z.string().uuid("Order ID harus berupa UUID yang valid"),
  slug: slugSchema,
});

export type InitializeInvitationInput = z.infer<typeof InitializeInvitationSchema>;

// ---------------------------------------------------------------------------
// 2. Wizard — Event sub-schema
//    Supports multi-event per invitation (e.g., Akad Nikah + Resepsi)
// ---------------------------------------------------------------------------
const MEDIA_TYPES = mediaTypeEnum.enumValues;

export const WizardEventSchema = z.object({
  eventName: z
    .string()
    .trim()
    .min(2, "Nama acara minimal 2 karakter")
    .max(100, "Nama acara maksimal 100 karakter"),

  date: isoDate,
  startTime: timeHHMM,

  /** Optional: specific time like "22:00" or descriptive text like "Selesai" */
  endTime: z.string().trim().max(20).optional(),

  /** Optional: "WIB" | "WITA" | "WIT" or full offset */
  timezone: z.string().trim().max(10).optional(),

  placeName: z
    .string()
    .trim()
    .min(2, "Nama tempat minimal 2 karakter")
    .max(255, "Nama tempat maksimal 255 karakter"),

  address: z
    .string()
    .trim()
    .min(5, "Alamat minimal 5 karakter"),

  mapsUrl: z
    .string()
    .trim()
    .url("URL Google Maps tidak valid")
    .optional()
    .or(z.literal("")),
});

export type WizardEventInput = z.infer<typeof WizardEventSchema>;

// ---------------------------------------------------------------------------
// 3. Wizard — Gallery sub-schema
// ---------------------------------------------------------------------------
export const WizardGallerySchema = z.object({
  mediaType: z.enum(MEDIA_TYPES, { message: "Tipe media harus 'image' atau 'video_link'" }),
  mediaUrl: z.string().trim().url("URL media tidak valid").max(2048),
  sortOrder: z.number().int().min(0).default(0),
});

export type WizardGalleryInput = z.infer<typeof WizardGallerySchema>;

// ---------------------------------------------------------------------------
// 4. SaveWizardSchema — Complete wizard payload
// ---------------------------------------------------------------------------
export const SaveWizardSchema = z.object({
  /** Core invitation info */
  title: z
    .string()
    .trim()
    .min(3, "Judul undangan minimal 3 karakter")
    .max(255, "Judul undangan maksimal 255 karakter"),

  musicUrl: z
    .string()
    .trim()
    .url("URL musik tidak valid")
    .max(2048)
    .optional()
    .or(z.literal("")),

  /** At least 1 event required */
  events: z
    .array(WizardEventSchema)
    .min(1, "Minimal 1 acara harus diisi")
    .max(10, "Maksimal 10 acara per undangan"),

  /** Gallery is optional (can be empty) */
  galleries: z.array(WizardGallerySchema).max(30, "Maksimal 30 item galeri").default([]),
});

export type SaveWizardInput = z.infer<typeof SaveWizardSchema>;
