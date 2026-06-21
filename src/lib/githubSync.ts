/**
 * Thin GitHub Contents API client for storing a single JSON file in the user's
 * own private repo. No backend: requests go straight from the browser to
 * api.github.com with a user-supplied fine-grained token.
 */

export interface SyncConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export interface GitHubFile {
  content: string; // decoded UTF-8 text
  sha: string;
}

export class SyncError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "SyncError";
    this.status = status;
  }
}

const API = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// UTF-8-safe base64 (btoa/atob are latin1-only).
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function asError(res: Response, fallback: string): Promise<SyncError> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.message ?? "";
  } catch {
    /* no json body */
  }
  return new SyncError(detail || fallback, res.status);
}

/** Validate token + repo access. Returns the authenticated login. */
export async function verify(cfg: SyncConfig): Promise<{ login: string }> {
  const userRes = await fetch(`${API}/user`, { headers: headers(cfg.token) });
  if (!userRes.ok) throw await asError(userRes, "Invalid token");
  const user = await userRes.json();

  const repoRes = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}`, {
    headers: headers(cfg.token),
  });
  if (!repoRes.ok) {
    throw await asError(repoRes, `Cannot access ${cfg.owner}/${cfg.repo}`);
  }
  return { login: user.login };
}

function contentsUrl(cfg: SyncConfig): string {
  return `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.path).replace(/%2F/g, "/")}`;
}

/** Fetch the data file. Returns null if it doesn't exist yet. */
export async function getFile(cfg: SyncConfig): Promise<GitHubFile | null> {
  const url = `${contentsUrl(cfg)}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: headers(cfg.token), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw await asError(res, "Failed to read file");
  const body = await res.json();
  return { content: decodeBase64(body.content ?? ""), sha: body.sha };
}

/**
 * Create or update the data file. Pass the current sha to update; null to create.
 * Throws SyncError with status 409 if the sha is stale (remote changed).
 */
export async function putFile(
  cfg: SyncConfig,
  json: string,
  sha: string | null,
  message: string,
): Promise<{ sha: string }> {
  const res = await fetch(contentsUrl(cfg), {
    method: "PUT",
    headers: { ...headers(cfg.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeBase64(json),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw await asError(res, "Failed to write file");
  const body = await res.json();
  return { sha: body.content?.sha as string };
}
