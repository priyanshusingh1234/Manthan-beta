/**
 * Canonical base URL for the application.
 *
 * Set the NEXT_PUBLIC_APP_URL environment variable to override.
 * Falls back to the production Vercel deployment so builds never crash
 * when the variable is absent.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://manthan-beta-c975.vercel.app';

/**
 * Returns the app's base URL in a way that works on both server and client.
 * On the client, prefers `window.location.origin` so the share/link always
 * reflects the actual domain the user is on (useful for preview deployments).
 * Falls back to `APP_URL` when `window` is not available (SSR/build time).
 */
export function getClientAppUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : APP_URL;
}
