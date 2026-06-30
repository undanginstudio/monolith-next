/**
 * Next.js 16 Proxy — Authentication & Route-Level RBAC
 * src/proxy.ts
 *
 *
 * Two-layer protection:
 *   Layer 1 — Authentication: redirect to /login if no valid session
 *   Layer 2 — Authorization:  redirect to /unauthorized if role lacks permission
 *
 * NOTE: This is the navigation guard only.
 * Server Actions apply a second independent check via `assertPermission()` —
 * so direct API/form abuse is also blocked even if Proxy is bypassed.
 *
 * Per the docs: "A matcher change or a refactor that moves a Server Function
 * to a different route can silently remove Proxy coverage. Always verify
 * authentication and authorization inside each Server Function."
 */
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { hasPermission, PERMISSIONS } from "@/features/auth/rbac";
import type { Permission } from "@/features/auth/rbac";
import type { UserRole } from "@/server/schema/auth";

// ---------------------------------------------------------------------------
// Route → Required Permission Map
//
// Matched with startsWith in order — more specific paths FIRST.
// Routes not listed here require only a valid session (any role).
// ---------------------------------------------------------------------------
const ROUTE_PERMISSION_MAP: ReadonlyArray<{
  prefix: string;
  permission: Permission;
}> = [
  // Superadmin only
  { prefix: "/dashboard/users", permission: PERMISSIONS.MANAGE_USERS },

  // Superadmin + Admin
  { prefix: "/dashboard/templates",   permission: PERMISSIONS.MANAGE_TEMPLATES },
  { prefix: "/dashboard/builder",     permission: PERMISSIONS.PRODUCE_INVITATIONS },
  { prefix: "/dashboard/invitations", permission: PERMISSIONS.PRODUCE_INVITATIONS },
  { prefix: "/dashboard/blast",       permission: PERMISSIONS.DISTRIBUTE_BLAST },
  { prefix: "/dashboard/guests",      permission: PERMISSIONS.DISTRIBUTE_BLAST },

  // All authenticated roles (superadmin + admin + finance)
  { prefix: "/dashboard/billing",   permission: PERMISSIONS.VERIFY_PAYMENTS },
  { prefix: "/dashboard/payments",  permission: PERMISSIONS.VERIFY_PAYMENTS },
  { prefix: "/dashboard/orders",    permission: PERMISSIONS.MANAGE_ORDERS },
  { prefix: "/dashboard/analytics", permission: PERMISSIONS.VIEW_ANALYTICS },
];

// ---------------------------------------------------------------------------
// Paths that are fully public — skip all checks
// ---------------------------------------------------------------------------
const PUBLIC_PATHS = [
  "/login",
  "/u",            // Guest invitation pages
  "/api/workflow", // QStash webhook callbacks
  "/unauthorized",
];

// ---------------------------------------------------------------------------
// Paths where an already-authenticated user should NOT land
// ---------------------------------------------------------------------------
const AUTH_REDIRECT_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAuthRedirectPath(pathname: string): boolean {
  return AUTH_REDIRECT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function resolveRequiredPermission(pathname: string): Permission | undefined {
  for (const { prefix, permission } of ROUTE_PERMISSION_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return permission;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Proxy function (renamed from `middleware` in Next.js 16)
// ---------------------------------------------------------------------------
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Pass through all public paths immediately ────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Resolve session JWT from cookie ──────────────────────────────────────
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // ── Layer 1: Authentication guard ────────────────────────────────────────
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated users on login page → redirect to dashboard ────────────
  if (isAuthRedirectPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Layer 2: Authorization guard (RBAC) ──────────────────────────────────
  const requiredPermission = resolveRequiredPermission(pathname);

  if (requiredPermission) {
    const userRole = session.role as UserRole;

    if (!hasPermission(userRole, requiredPermission)) {
      const forbiddenUrl = new URL("/unauthorized", request.url);
      forbiddenUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // ── Forward decoded identity to Server Components via request headers ─────
  // Use NextResponse.next({ request }) to attach headers to the upstream request
  return NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        "x-user-id":   session.userId,
        "x-user-role": session.role,
      }),
    },
  });
}

// ---------------------------------------------------------------------------
// Matcher — run Proxy on all routes except static assets
// From docs: even when excluded, Proxy still runs on _next/data routes.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
