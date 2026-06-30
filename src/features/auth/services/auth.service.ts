/**
 * Auth Service — Infrastructure Layer
 *
 * Direct DB queries for the auth domain.
 * Called by Server Actions only — never from UI components.
 */
import { db } from "@/server/db";
import { users } from "@/server/schema/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { AuthUser } from "../types";

const BCRYPT_ROUNDS = 12;

/**
 * Find an active user by email.
 * Returns null if not found or inactive.
 */
export async function findActiveUserByEmail(
  email: string
): Promise<(AuthUser & { passwordHash: string }) | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    passwordHash: user.passwordHash,
  };
}

/**
 * Verify a plain-text password against a bcrypt hash.
 * Uses bcryptjs (pure JS — safe for serverless, no native bindings).
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Hash a plain-text password.
 * Use this when creating or updating user accounts.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}
