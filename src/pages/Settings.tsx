import { useState } from "react";
import {
  Cloud,
  ShieldAlert,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Plug,
  Unplug,
  ExternalLink,
} from "lucide-react";
import { useSyncContext } from "@/hooks/SyncContext";
import { DEFAULT_CONFIG } from "@/hooks/useSync";
import type { SyncConfig } from "@/lib/githubSync";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { relativeTime } from "@/components/SyncStatus";

export function Settings() {
  const { config, connected, status, lastSyncedAt, lastError, connect, disconnect, pull, push, syncNow } =
    useSyncContext();

  const [form, setForm] = useState<SyncConfig>(config ?? DEFAULT_CONFIG);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const set = <K extends keyof SyncConfig>(k: K, v: SyncConfig[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const run = async (label: string, fn: () => Promise<unknown>, okText: string) => {
    setBusy(label);
    setMessage(null);
    try {
      await fn();
      setMessage({ kind: "ok", text: okText });
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setBusy(null);
    }
  };

  const canConnect = form.token.trim() && form.owner.trim() && form.repo.trim();

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Sync your data to your own private GitHub repo so it's safe and available on every device.
        </p>
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)" }}
          >
            <Cloud className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">GitHub Sync</h2>
            <p className="text-sm text-muted-foreground">
              {connected ? (
                <>
                  Connected to{" "}
                  <span className="text-foreground">
                    {config?.owner}/{config?.repo}
                  </span>
                  {status === "idle" && lastSyncedAt && <> · synced {relativeTime(lastSyncedAt)}</>}
                  {status === "offline" && <> · offline</>}
                  {status === "syncing" && <> · syncing…</>}
                </>
              ) : (
                "Not connected"
              )}
            </p>
          </div>
        </div>

        {!connected ? (
          <div className="space-y-4">
            <div>
              <Label>Fine-grained access token</Label>
              <Input
                type="password"
                value={form.token}
                onChange={(e) => set("token", e.target.value)}
                placeholder="github_pat_..."
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner (your username)</Label>
                <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="octocat" />
              </div>
              <div>
                <Label>Repository</Label>
                <Input value={form.repo} onChange={(e) => set("repo", e.target.value)} placeholder="studytracker-data" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>File path</Label>
                <Input value={form.path} onChange={(e) => set("path", e.target.value)} />
              </div>
              <div>
                <Label>Branch</Label>
                <Input value={form.branch} onChange={(e) => set("branch", e.target.value)} />
              </div>
            </div>
            <Button
              variant="primary"
              disabled={!canConnect || busy !== null}
              onClick={() =>
                run("connect", () => connect(form), "Connected — your data is now syncing.")
              }
            >
              <Plug className="h-4 w-4" /> {busy === "connect" ? "Connecting…" : "Connect & test"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy !== null} onClick={() => run("sync", syncNow, "Synced.")}>
              <RefreshCw className={busy === "sync" ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Sync now
            </Button>
            <Button disabled={busy !== null} onClick={() => run("pull", pull, "Pulled latest from GitHub.")}>
              <Download className="h-4 w-4" /> Pull
            </Button>
            <Button disabled={busy !== null} onClick={() => run("push", push, "Pushed local data to GitHub.")}>
              <Upload className="h-4 w-4" /> Push
            </Button>
            <Button variant="danger" disabled={busy !== null} onClick={disconnect}>
              <Unplug className="h-4 w-4" /> Disconnect
            </Button>
          </div>
        )}

        {message && (
          <div
            className={
              message.kind === "ok"
                ? "flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                : "flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
            }
          >
            {message.kind === "ok" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}
        {lastError && !message && (
          <p className="text-sm text-rose-300">{lastError}</p>
        )}
      </Card>

      {/* Setup help */}
      <Card className="space-y-3 p-6 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground">How to set this up</h3>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Create a <span className="text-foreground">private</span> repo (e.g.{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">studytracker-data</code>).
          </li>
          <li>
            Create a fine-grained token at{" "}
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline"
            >
              github.com/settings/tokens <ExternalLink className="h-3 w-3" />
            </a>{" "}
            scoped to <span className="text-foreground">only that repo</span>, with{" "}
            <span className="text-foreground">Contents: Read and write</span>.
          </li>
          <li>Paste it above with your username and repo name, then Connect.</li>
        </ol>
      </Card>

      {/* Security note */}
      <Card className="flex gap-3 border-amber-500/30 bg-amber-500/5 p-5">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">About your token</p>
          <p>
            Your token is stored only in this browser and is sent only to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">api.github.com</code> — never to
            any other server. Use a fine-grained token limited to the single data repo, and click{" "}
            <span className="text-foreground">Disconnect</span> to wipe it. Avoid connecting on a
            shared or public computer.
          </p>
        </div>
      </Card>
    </div>
  );
}
