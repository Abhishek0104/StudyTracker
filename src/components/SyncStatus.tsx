import { Link } from "react-router-dom";
import { Cloud, CloudOff, RefreshCw, AlertCircle, CircleSlash } from "lucide-react";
import { useSyncContext } from "@/hooks/SyncContext";
import { cn } from "@/lib/utils";

export function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const META = {
  disconnected: { icon: CircleSlash, color: "#94a3b8", label: "Not connected" },
  idle: { icon: Cloud, color: "#34d399", label: "Synced" },
  syncing: { icon: RefreshCw, color: "#22d3ee", label: "Syncing…" },
  offline: { icon: CloudOff, color: "#fbbf24", label: "Offline" },
  error: { icon: AlertCircle, color: "#fb7185", label: "Sync error" },
} as const;

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const { status, lastSyncedAt } = useSyncContext();
  const m = META[status];
  const Icon = m.icon;
  const detail =
    status === "idle" && lastSyncedAt ? `Synced ${relativeTime(lastSyncedAt)}` : m.label;

  return (
    <Link
      to="/settings"
      title={detail}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50",
        compact ? "" : "w-full",
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", status === "syncing" && "animate-spin")}
        style={{ color: m.color }}
      />
      {!compact && <span className="truncate text-muted-foreground">{detail}</span>}
    </Link>
  );
}
