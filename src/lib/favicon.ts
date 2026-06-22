/**
 * Best-effort favicon URL for a link — the destination site's own icon.
 * No backend / no third-party service: just the origin's /favicon.ico, loaded
 * as an <img> with a graceful fallback handled by the caller (onError).
 */
export function faviconUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `${u.origin}/favicon.ico`;
  } catch {
    return null;
  }
}
