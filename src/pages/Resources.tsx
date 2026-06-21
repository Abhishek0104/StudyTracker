import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { curriculum } from "@/data/curriculum";
import { PILLAR_PALETTE, type ReadingStatus, type Resource, type ResourceType } from "@/data/types";
import { useResourcesContext } from "@/hooks/ResourcesContext";
import { READING_STATUS_META } from "@/lib/readingStatus";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourceFormDialog, type ResourceFormResult } from "@/components/ResourceFormDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: { value: ResourceType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "book", label: "Books" },
  { value: "course", label: "Courses" },
  { value: "web", label: "Web" },
  { value: "practice", label: "Practice" },
];

const STATUS_FILTERS: { value: ReadingStatus | "all"; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "to-read", label: "To read" },
  { value: "reading", label: "Reading" },
  { value: "done", label: "Done" },
];

export function Resources() {
  const { allResources, addResource, updateResource, deleteResource, getStatus, setStatus, cycleStatus } =
    useResourcesContext();

  const [pillarFilter, setPillarFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "all">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | undefined>(undefined);

  const filtered = useMemo(
    () =>
      allResources.filter(
        (r) =>
          (pillarFilter === "all" || r.pillarIds.includes(pillarFilter)) &&
          (typeFilter === "all" || r.type === typeFilter) &&
          (statusFilter === "all" || getStatus(r.id) === statusFilter),
      ),
    [allResources, pillarFilter, typeFilter, statusFilter, getStatus],
  );

  const openAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (r: Resource) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const handleSubmit = (result: ResourceFormResult) => {
    if (editing) {
      updateResource(editing.id, result.draft);
      setStatus(editing.id, result.status);
    } else {
      const id = addResource(result.draft);
      setStatus(id, result.status);
    }
  };

  const handleDelete = (r: Resource) => {
    if (confirm(`Delete "${r.title}"?`)) deleteResource(r.id);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="mt-1 text-muted-foreground">
            Your study materials and saved links. Set a reading status to use this as your idea hub.
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add resource
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All pillars" active={pillarFilter === "all"} onClick={() => setPillarFilter("all")} />
          {curriculum.map((p) => {
            const c = PILLAR_PALETTE[p.color];
            const active = pillarFilter === p.id;
            return (
              <FilterChip
                key={p.id}
                label={p.title}
                active={active}
                onClick={() => setPillarFilter(p.id)}
                style={active ? { background: c.soft, color: c.text, borderColor: "transparent" } : undefined}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              active={typeFilter === t.value}
              onClick={() => setTypeFilter(t.value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s.value;
            const meta = s.value !== "all" ? READING_STATUS_META[s.value] : null;
            return (
              <FilterChip
                key={s.value}
                label={s.label}
                active={active}
                onClick={() => setStatusFilter(s.value)}
                style={active && meta ? { background: meta.bg, color: meta.color, borderColor: "transparent" } : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No resources match these filters.{" "}
          <button onClick={openAdd} className="font-medium text-foreground underline">
            Add one?
          </button>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              status={getStatus(r.id)}
              onCycleStatus={() => cycleStatus(r.id)}
              onEdit={r.source === "user" ? () => openEdit(r) : undefined}
              onDelete={r.source === "user" ? () => handleDelete(r) : undefined}
            />
          ))}
        </div>
      )}

      <ResourceFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        initialStatus={editing ? getStatus(editing.id) : undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  style,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-foreground/20 bg-foreground/10 text-foreground"
          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
