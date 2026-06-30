/**
 * Admin Login Server Action — Undangin.studio
 * src/features/auth/actions/login.ts
 *
 * Enforces BR-001: Only users with roles 'superadmin', 'admin', or 'finance'
 * can access the admin dashboard.
 */
"use server";

import { z } from "zod";
import { findActiveUserByEmail, verifyPassword } from "../services/auth.service";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import type { AuthActionResult, AuthUser } from "../types";

// ---------------------------------------------------------------------------
// Zod Schema for Login
// ---------------------------------------------------------------------------
const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

export type LoginActionInput = z.infer<typeof LoginSchema>;

/**
 * Server Action to authenticate admin portal access.
 * Enforces BR-001 (superadmin, admin, finance role validation) and
 * sets the secure HttpOnly cookie session on success.
 */
export async function loginAdminAction(
  rawInput: LoginActionInput
): Promise<AuthActionResult<AuthUser>> {
  // ── 1. Input Validation ──────────────────────────────────────────────────
  const parsed = LoginSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
        k,
        v?.[0] ?? "Input tidak valid",
      ])
    );
    return {
      success: false,
      error: "Kredensial login tidak valid.",
      fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  try {
    // ── 2. DB Fetch (Active users only) ──────────────────────────────────────
    const user = await findActiveUserByEmail(email);
    if (!user) {
      // Prevent user enumeration attacks
      return {
        success: false,
        error: "Email atau password salah.",
      };
    }

    // ── 3. BR-001 Role Enforcement ──────────────────────────────────────────
    // Valid roles: superadmin, admin, finance
    const allowedRoles = ["superadmin", "admin", "finance"];
    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: "Akses ditolak. Akun Anda tidak memiliki izin portal admin.",
      };
    }

    // ── 4. Verify password hash ──────────────────────────────────────────────
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        error: "Email atau password salah.",
      };
    }

    // ── 5. Create stateless JWT session and set HttpOnly cookie ──────────────
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await setSessionCookie(token);

    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    return { success: true, data: safeUser };
  } catch (error) {
    console.error("[loginAdminAction] Login Error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat mencoba masuk. Silakan coba lagi.",
    };
  }
}
