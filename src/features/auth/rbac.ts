/**
 * RBAC — Role-Based Access Control Engine
 * Undangin.studio — src/features/auth/rbac.ts
 *
 * Single source of truth for all permission definitions and role assignments.
 * Pure functions — no I/O, no side effects. Safe to import anywhere.
 *
 * Architecture:
 *  - `Permission`        → string literal union (all possible permissions)
 *  - `ROLE_PERMISSIONS`  → immutable mapping: Role → Set<Permission>
 *  - `hasPermission()`   → pure boolean check (use in components, middleware)
 *  - `assertPermission()`→ async guard for Server Actions (throws on failure)
 */
import type { UserRole } from "@/server/schema/auth";
import { getSession } from "@/lib/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// 1. Permission Definitions
//    Each permission maps to a specific business capability.
// ---------------------------------------------------------------------------
export const PERMISSIONS = {
  /** Create, deactivate, and delete internal admin accounts */
  MANAGE_USERS: "manage:users",
  /** CRUD operations on the invitation template catalog */
  MANAGE_TEMPLATES: "manage:templates",
  /** View orders, create invoices, update order status */
  MANAGE_ORDERS: "manage:orders",
  /** Approve or reject manual WhatsApp payment receipts */
  VERIFY_PAYMENTS: "verify:payments",
  /** Access invitation wizard builder, edit content, publish */
  PRODUCE_INVITATIONS: "produce:invitations",
  /** Import guest Excel lists, trigger WhatsApp blast campaigns */
  DISTRIBUTE_BLAST: "distribute:blast",
  /** View global dashboard statistics and RSVP reports */
  VIEW_ANALYTICS: "view:analytics",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ---------------------------------------------------------------------------
// 2. Role Constants — mirrors the `user_role` PostgreSQL enum exactly
// ---------------------------------------------------------------------------
export const ROLES = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  FINANCE: "finance",
} as const satisfies Record<string, UserRole>;

// ---------------------------------------------------------------------------
// 3. Permission Matrix
//    Immutable mapping: each role owns a frozen Set of permissions.
//    Single place to change access control — satisfies Open/Closed principle.
// ---------------------------------------------------------------------------
const ALL_PERMISSIONS = new Set<Permission>(Object.values(PERMISSIONS));

const ROLE_PERMISSIONS: Readonly<Record<UserRole, ReadonlySet<Permission>>> = {
  superadmin: ALL_PERMISSIONS,

  admin: new Set<Permission>([
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VERIFY_PAYMENTS,
    PERMISSIONS.PRODUCE_INVITATIONS,
    PERMISSIONS.DISTRIBUTE_BLAST,
    PERMISSIONS.VIEW_ANALYTICS,
  ]),

  finance: new Set<Permission>([
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VERIFY_PAYMENTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ]),
} as const;

// ---------------------------------------------------------------------------
// 4. hasPermission — Pure synchronous check
//    Use in: React Server Components, middleware helpers, client guards.
//
//    @example
//    if (!hasPermission(session.role, PERMISSIONS.MANAGE_USERS)) {
//      return <Forbidden />;
//    }
// ---------------------------------------------------------------------------
export function hasPermission(
  userRole: UserRole,
  requiredPermission: Permission
): boolean {
  return ROLE_PERMISSIONS[userRole]?.has(requiredPermission) ?? false;
}

// ---------------------------------------------------------------------------
// 5. getAllPermissions — Returns all permissions for a given role
//    Use for: building UI permission guards, serializing to session if needed.
// ---------------------------------------------------------------------------
export function getAllPermissions(userRole: UserRole): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[userRole] ?? new Set();
}

// ---------------------------------------------------------------------------
// 6. assertPermission — Async server-side guard for Server Actions
//
//    Reads the current session JWT from HttpOnly cookie, then verifies
//    both authentication (session exists) and authorization (has permission).
//
//    Throws:
//      - `UnauthorizedError` if no valid session exists
//      - `ForbiddenError`    if session exists but role lacks the permission
//
//    Call this as the FIRST line of every protected Server Action.
//    If it doesn't throw, the caller is guaranteed to be authorized.
//
//    @example
//    export async function publishInvitationAction(id: string) {
//      await assertPermission(PERMISSIONS.PRODUCE_INVITATIONS);
//      // ... safe to proceed
//    }
// ---------------------------------------------------------------------------
export async function assertPermission(
  requiredPermission: Permission
): Promise<void> {
  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  if (!hasPermission(session.role, requiredPermission)) {
    throw new ForbiddenError(requiredPermission, session.role);
  }
}

// ---------------------------------------------------------------------------
// 7. assertAnyPermission — Passes if the user has AT LEAST ONE of the listed
//    permissions. Useful for compound-access routes.
//
//    @example
//    await assertAnyPermission([PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VERIFY_PAYMENTS]);
// ---------------------------------------------------------------------------
export async function assertAnyPermission(
  requiredPermissions: Permission[]
): Promise<void> {
  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  const hasAny = requiredPermissions.some((p) =>
    hasPermission(session.role, p)
  );

  if (!hasAny) {
    throw new ForbiddenError(requiredPermissions.join(" | "), session.role);
  }
}
