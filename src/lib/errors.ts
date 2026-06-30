/**
 * Custom Application Errors — Undangin.studio
 *
 * Centralized error classes for consistent error handling across
 * Server Actions, Services, and API Routes.
 *
 * These extend Error so they can be caught with `instanceof` checks.
 */

// ---------------------------------------------------------------------------
// Base application error
// ---------------------------------------------------------------------------
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Restore prototype chain (required when extending built-in classes in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// 401 — Not authenticated (no valid session)
// ---------------------------------------------------------------------------
export class UnauthorizedError extends AppError {
  constructor(message = "Sesi tidak ditemukan. Silakan login kembali.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// ---------------------------------------------------------------------------
// 403 — Authenticated but lacks permission for the resource
// ---------------------------------------------------------------------------
export class ForbiddenError extends AppError {
  public readonly requiredPermission: string;
  public readonly userRole: string;

  constructor(
    requiredPermission: string,
    userRole: string,
    message?: string
  ) {
    super(
      message ??
        `Akses ditolak. Role '${userRole}' tidak memiliki izin '${requiredPermission}'.`,
      403,
      "FORBIDDEN"
    );
    this.requiredPermission = requiredPermission;
    this.userRole = userRole;
  }
}

// ---------------------------------------------------------------------------
// 404 — Resource not found
// ---------------------------------------------------------------------------
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} tidak ditemukan.`, 404, "NOT_FOUND");
  }
}

// ---------------------------------------------------------------------------
// 409 — Conflict (e.g., duplicate slug, duplicate order number)
// ---------------------------------------------------------------------------
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}
