import { BookOpen, GraduationCap, Globe, Code2, ExternalLink, Pencil, Trash2, Circle } from "lucide-react";
import type { ReadingStatus, Resource, ResourceType } from "@/data/types";
import { PILLAR_PALETTE } from "@/data/types";
import { useCurriculumContext } from "@/hooks/CurriculumContext";
import { READING_STATUS_META } from "@/lib/readingStatus";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

const TYPE_META: Record<ResourceType, { icon: typeof BookOpen; label: string }> = {
  book: { icon: BookOpen, label: "Book" },
  course: { icon: GraduationCap, label: "Course" },
  web: { icon: Globe, label: "Web" },
  practice: { icon: Code2, label: "Practice" },
};

interface ResourceCardProps {
  resource: Resource;
  status?: ReadingStatus;
  onCycleStatus: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ResourceCard({ resource, status, onCycleStatus, onEdit, onDelete }: ResourceCardProps) {
  const { curriculum } = useCurriculumContext();
  const meta = TYPE_META[resource.type];
  const Icon = meta.icon;
  const pillars = curriculum.filter((p) => resource.pillarIds.includes(p.id));
  const accent = pillars[0] ? PILLAR_PALETTE[pillars[0].color] : null;
  const statusMeta = status ? READING_STATUS_META[status] : null;
  const isUser = resource.source === "user";

  return (
    <Card className="flex flex-col gap-3 p-5 hover:border-muted-foreground/40">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: accent ? `linear-gradient(135deg, ${accent.from}, ${accent.to})` : "hsl(var(--muted))",
          }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <Badge>{meta.label}</Badge>
          {isUser && (
            <>
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label="Edit resource"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label="Delete resource"
                  className="rounded-md p-1 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold leading-tight">{resource.title}</h3>
        {resource.author && (
          <p className="mt-0.5 text-sm text-muted-foreground">{resource.author}</p>
        )}
      </div>

      {resource.note && <p className="text-sm text-muted-foreground">{resource.note}</p>}

      {resource.tags && resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resource.tags.map((t) => (
            <span key={t} className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        {pillars.map((p) => {
          const c = PILLAR_PALETTE[p.color];
          return (
            <span
              key={p.id}
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: c.soft, color: c.text }}
            >
              {p.title}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <button
          onClick={onCycleStatus}
          title="Click to cycle reading status"
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
          style={
            statusMeta
              ? { background: statusMeta.bg, color: statusMeta.color, borderColor: "transparent" }
              : undefined
          }
        >
          {statusMeta ? (
            <span className="h-2 w-2 rounded-full" style={{ background: statusMeta.color }} />
          ) : (
            <Circle className="h-3 w-3 text-muted-foreground" />
          )}
          {statusMeta ? statusMeta.label : "Set status"}
        </button>

        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            Open <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </Card>
  );
}
