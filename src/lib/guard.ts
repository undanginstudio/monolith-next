/**
 * RBAC-Aware Layout Guard — Undangin.studio
 * src/lib/guard.ts
 *
 * Server Component utility to enforce RBAC at the layout/page level.
 * Use this as a secondary guard inside (admin) layouts for component-level
 * conditional rendering — beyond middleware route protection.
 *
 * Why both middleware AND layout guards?
 *   - Middleware protects at the EDGE (fast redirect before rendering)
 *   - Layout guards protect COMPONENT TREE (conditional rendering, feature flags)
 *   - Having both follows defense-in-depth principle
 *
 * IMPORTANT: These helpers call `getSession()` which reads next/headers.
 * Only call from Server Components, Layouts, or Server Actions.
 */
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasPermission, type Permission } from "@/features/auth/rbac";
import type { SessionPayload } from "@/lib/session";

// ---------------------------------------------------------------------------
// requireAuth
// Asserts a valid session exists. Redirects to /login if not.
// Returns the session for use in the calling layout/page.
// ---------------------------------------------------------------------------
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

// ---------------------------------------------------------------------------
// requirePermission
// Asserts auth + specific permission. Redirects to /unauthorized if lacking.
// Returns the session on success.
// ---------------------------------------------------------------------------
export async function requirePermission(
  permission: Permission
): Promise<SessionPayload> {
  const session = await requireAuth();

  if (!hasPermission(session.role, permission)) {
    redirect(`/unauthorized?from=${permission}`);
  }

  return session;
}

// ---------------------------------------------------------------------------
// getSessionUnsafe
// Read-only session accessor — does NOT redirect.
// Use for conditional UI rendering (e.g., hide a button if no permission).
// Returns null if not authenticated.
// ---------------------------------------------------------------------------
export async function getSessionUnsafe(): Promise<SessionPayload | null> {
  return getSession();
}

// ---------------------------------------------------------------------------
// canAccess
// Boolean check for conditional rendering within a Server Component.
//
// @example
// const can = await buildAbility(session.role);
// {can.produce && <BuilderButton />}
// ---------------------------------------------------------------------------
export function buildAbility(role: SessionPayload["role"]) {
  return {
    manageUsers: hasPermission(role, "manage:users"),
    manageTemplates: hasPermission(role, "manage:templates"),
    manageOrders: hasPermission(role, "manage:orders"),
    verifyPayments: hasPermission(role, "verify:payments"),
    produce: hasPermission(role, "produce:invitations"),
    blast: hasPermission(role, "distribute:blast"),
    viewAnalytics: hasPermission(role, "view:analytics"),
  };
}

export type Ability = ReturnType<typeof buildAbility>;
