/**
 * Suggest a readable title from a URL, with no network call (we can't scrape the
 * real page title without a backend). Uses the host + a de-slugged last path
 * segment, e.g.:
 *   https://jalammar.github.io/illustrated-transformer/ → "Illustrated Transformer — jalammar.github.io"
 *   https://arxiv.org/abs/2205.14135                    → "2205.14135 — arxiv.org"
 *   https://cs229.stanford.edu                          → "cs229.stanford.edu"
 * Always editable by the user.
 */
export function suggestTitle(url: string): string {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    const segments = u.pathname.split("/").filter(Boolean);
    let last = decodeURIComponent(segments[segments.length - 1] ?? "");
    // Drop a common document extension, then de-slugify.
    last = last.replace(/\.(html?|php|aspx?|pdf|md)$/i, "").replace(/[-_]+/g, " ").trim();

    if (!last) return host;
    const pretty = last.replace(/\b\w/g, (ch) => ch.toUpperCase());
    return `${pretty} — ${host}`;
  } catch {
    return "";
  }
}
