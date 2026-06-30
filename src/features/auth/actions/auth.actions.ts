/**
 * Auth Server Actions — Undangin.studio
 *
 * Business logic layer: orchestrates service calls, session management,
 * input validation, and redirects.
 *
 * "use server" — all exports are Server Actions callable from forms/clients.
 */
"use server";

import { redirect } from "next/navigation";
import { findActiveUserByEmail, verifyPassword } from "../services/auth.service";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/session";
import type { AuthActionResult, LoginInput, AuthUser } from "../types";

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
/**
 * Authenticate an admin user.
 * On success: sets the session cookie and redirects to /dashboard.
 * On failure: returns a typed error result (no throw — safe for React forms).
 */
export async function login(
  input: LoginInput
): Promise<AuthActionResult<AuthUser>> {
  // --- 1. Basic input validation ---
  const email = input.email?.trim().toLowerCase();
  const password = input.password?.trim();

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan password wajib diisi.",
      fieldErrors: {
        email: !email ? "Email wajib diisi." : undefined,
        password: !password ? "Password wajib diisi." : undefined,
      },
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error: "Format email tidak valid.",
      fieldErrors: { email: "Format email tidak valid." },
    };
  }

  // --- 2. DB lookup ---
  const user = await findActiveUserByEmail(email);

  // Use a generic message for both "user not found" and "wrong password"
  // to prevent user enumeration attacks.
  if (!user) {
    return { success: false, error: "Email atau password salah." };
  }

  // --- 3. Password verification ---
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Email atau password salah." };
  }

  // --- 4. Create & set session ---
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  await setSessionCookie(token);

  // Return user data (without passwordHash) for the client to use optimistically.
  const safeUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };

  return { success: true, data: safeUser };
}

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------
/**
 * Clear the session cookie and redirect to the login page.
 * Must be called from a Server Action form or button — not from client JS directly.
 */
export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------
/**
 * Read the current session payload from the request cookies.
 * Safe to call from Server Components and Server Actions.
 * Returns null if the user is not authenticated or the token has expired.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    isActive: true,
  };
}
