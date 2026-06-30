import { redirect } from "next/navigation";

/**
 * Root Page — Undangin.studio
 *
 * Serves as a portal entry point.
 * Redirects authenticated users → /dashboard
 * Redirects unauthenticated users → /login
 *
 * TODO: Replace static redirect with session-based routing once auth is wired.
 */
export default function RootPage() {
  // Placeholder: redirect to dashboard as default.
  // Replace with: const session = await getSession(); if (!session) redirect("/login");
  redirect("/dashboard");
}
