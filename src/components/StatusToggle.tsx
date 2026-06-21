import { Check, Circle, CircleDot } from "lucide-react";
import type { Status } from "@/data/types";
import { cn } from "@/lib/utils";

interface StatusToggleProps {
  status: Status;
  onClick: () => void;
  accent: string;
}

const CONFIG: Record<Status, { icon: typeof Circle; label: string }> = {
  "not-started": { icon: Circle, label: "Not started" },
  "in-progress": { icon: CircleDot, label: "In progress" },
  done: { icon: Check, label: "Done" },
};

export function StatusToggle({ status, onClick, accent }: StatusToggleProps) {
  const { icon: Icon, label } = CONFIG[status];
  const active = status !== "not-started";
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} — click to change`}
      aria-label={`Status: ${label}. Click to change.`}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
        status === "done" && "text-white",
        status === "in-progress" && "text-white",
        status === "not-started" &&
          "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
      )}
      style={
        active
          ? { backgroundColor: accent, borderColor: accent }
          : undefined
      }
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={status === "done" ? 3 : 2} />
    </button>
  );
}
