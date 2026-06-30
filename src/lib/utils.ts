import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — Type-safe, conflict-resolving Tailwind class name utility.
 *
 * Combines `clsx` (conditional class merging) with `tailwind-merge`
 * (Tailwind-aware conflict resolution) to ensure the last class always wins.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-brand-500", className)
 * cn("text-sm text-gray-500", "text-lg") // → "text-lg" (no conflict duplication)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * `formatDate` — Locale-aware date formatter.
 * Formats a date value to a human-readable Indonesian locale string by default.
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  locale = "id-ID"
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * `slugify` — Converts a string to a URL-safe slug.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * `assertEnv` — Asserts that a required server-side environment variable exists.
 * Throws a descriptive error at module-load time rather than at runtime call site.
 * Only call from server-side modules (Server Actions, Route Handlers, db/).
 */
export function assertEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Undangin.studio] Missing required environment variable: "${key}". ` +
        `Check your .env.local file.`
    );
  }
  return value;
}
