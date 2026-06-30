/**
 * Session Management — Undangin.studio
 *
 * Strategy: Stateless JWT stored in an HttpOnly, Secure, SameSite=Lax cookie.
 * Library: `jose` (Edge Runtime compatible — no native bindings needed).
 *
 * SERVER-SIDE ONLY. Used by auth actions and middleware.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/server/schema/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const SESSION_COOKIE_NAME = "__undangin_session";
const SESSION_DURATION_HOURS = 8;
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// JWT Secret — must be at least 32 bytes for HS256
// ---------------------------------------------------------------------------
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[Undangin.studio] JWT_SECRET must be set and at least 32 characters long."
    );
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Payload shape
// ---------------------------------------------------------------------------
export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

// ---------------------------------------------------------------------------
// Create & sign a new session token
// ---------------------------------------------------------------------------
export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">
): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(secret);
}

// ---------------------------------------------------------------------------
// Verify and decode an existing token
// Returns null if invalid/expired (safe for middleware use)
// ---------------------------------------------------------------------------
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify<SessionPayload>(token, secret, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers — used from Server Actions (need `cookies()` from next/headers)
// ---------------------------------------------------------------------------
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000, // maxAge is in seconds
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Read the current session from the request cookies (Server Components / Actions)
// Returns null if no valid session exists
// ---------------------------------------------------------------------------
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
