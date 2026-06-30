import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akses Ditolak",
  robots: { index: false, follow: false },
};

/**
 * Unauthorized Page — shown when a user attempts to access a route
 * they don't have permission for (middleware RBAC redirect).
 *
 * No UI framework imports here — page intentionally kept minimal.
 * Replace with styled Mantine UI component in Phase 2.
 */
export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-6 text-center">
      <p className="text-6xl font-bold text-[var(--color-brand-500)]">403</p>
      <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">
        Akses Ditolak
      </h1>
      <p className="mt-2 text-[var(--color-text-muted)]">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      {searchParams.from && (
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Halaman: <code className="font-mono">{searchParams.from}</code>
        </p>
      )}
      <a
        href="/dashboard"
        className="mt-6 rounded-lg bg-[var(--color-brand-500)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-600)]"
      >
        Kembali ke Dashboard
      </a>
    </main>
  );
}
