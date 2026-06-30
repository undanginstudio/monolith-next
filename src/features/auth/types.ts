/**
 * Auth Feature — Domain Types (V1.1)
 */
import type { UserRole } from "@/server/schema/auth";
import type { SessionPayload } from "@/lib/session";

// Re-export for convenience
export type { UserRole, SessionPayload };

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

/** Discriminated union for all auth Server Action results */
export type AuthActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Partial<Record<keyof LoginInput, string>> };
