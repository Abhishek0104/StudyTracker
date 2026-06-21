import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Plus, Link2 } from "lucide-react";
import { curriculum } from "@/data/curriculum";
import { PILLAR_PALETTE, type Pillar, type Resource, type Subtopic } from "@/data/types";
import { useProgressContext } from "@/hooks/ProgressContext";
import { useResourcesContext } from "@/hooks/ResourcesContext";
import { pillarStats, statusOf, topicStats } from "@/lib/progress";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ProgressRing";
import { StatusToggle } from "@/components/StatusToggle";
import { PillarIcon } from "@/components/PillarIcon";
import { ResourceFormDialog, type ResourceFormResult } from "@/components/ResourceFormDialog";
import { cn } from "@/lib/utils";

export function Curriculum() {
  const location = useLocation();
  const initialPillar =
    (location.state as { pillarId?: string } | null)?.pillarId ?? curriculum[0].id;
  const [activeId, setActiveId] = useState(initialPillar);

  const { progress } = useProgressContext();
  const { allResources, addResource, setStatus } = useResourcesContext();

  // Resolve the resources attached to a subtopic: seed (via subtopic.resourceIds)
  // + user resources (via resource.subtopicIds), de-duplicated.
  const resourceById = useMemo(
    () => new Map(allResources.map((r) => [r.id, r])),
    [allResources],
  );
  const getLinks = useMemo(() => {
    return (sub: Subtopic): Resource[] => {
      const out = new Map<string, Resource>();
      for (const id of sub.resourceIds ?? []) {
        const r = resourceById.get(id);
        if (r) out.set(r.id, r);
      }
      for (const r of allResources) {
        if (r.subtopicIds?.includes(sub.id)) out.set(r.id, r);
      }
      return [...out.values()];
    };
  }, [allResources, resourceById]);

  // Attach-link dialog.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSubtopic, setPendingSubtopic] = useState<string | undefined>(undefined);
  const onAddLink = (subtopicId: string) => {
    setPendingSubtopic(subtopicId);
    setDialogOpen(true);
  };
  const handleSubmit = (result: ResourceFormResult) => {
    const id = addResource(result.draft);
    setStatus(id, result.status);
  };

  const pillar = curriculum.find((p) => p.id === activeId) ?? curriculum[0];
  const c = PILLAR_PALETTE[pillar.color];
  const stats = pillarStats(pillar, progress);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
        <p className="mt-1 text-muted-foreground">
          The complete picture. Click a status dot to cycle Not started → In progress → Done.
        </p>
      </div>

      {/* Pillar selector */}
      <div className="flex flex-wrap gap-2">
        {curriculum.map((p) => {
          const pc = PILLAR_PALETTE[p.color];
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                active
                  ? "border-transparent text-white"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
              )}
              style={active ? { background: `linear-gradient(135deg, ${pc.from}, ${pc.to})` } : undefined}
            >
              <PillarIcon name={p.icon} className="h-4 w-4" />
              {p.title}
            </button>
          );
        })}
      </div>

      {/* Pillar header card */}
      <Card className="flex flex-wrap items-center gap-6 p-6">
        <ProgressRing value={stats.percent} from={c.from} to={c.to} size={104} sublabel="complete" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
            >
              <PillarIcon name={pillar.icon} className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{pillar.title}</h2>
              <p className="text-sm text-muted-foreground">{pillar.blurb}</p>
            </div>
          </div>
          <div className="mt-4 max-w-md">
            <ProgressBar value={stats.percent} from={c.from} to={c.to} />
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.done} done · {stats.inProgress} in progress · {stats.total} total
            </div>
          </div>
        </div>
      </Card>

      {/* Topics */}
      <div className="space-y-3">
        {pillar.topics.map((topic) => (
          <TopicRow key={topic.id} topic={topic} pillar={pillar} getLinks={getLinks} onAddLink={onAddLink} />
        ))}
      </div>

      <ResourceFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialSubtopicId={pendingSubtopic}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function TopicRow({
  topic,
  pillar,
  getLinks,
  onAddLink,
}: {
  topic: Pillar["topics"][number];
  pillar: Pillar;
  getLinks: (sub: Subtopic) => Resource[];
  onAddLink: (subtopicId: string) => void;
}) {
  const { progress, cycleStatus } = useProgressContext();
  const [open, setOpen] = useState(true);
  const c = PILLAR_PALETTE[pillar.color];
  const stats = topicStats(topic, progress);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/30"
      >
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{topic.title}</span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {stats.done}/{stats.total}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={stats.percent} from={c.from} to={c.to} />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="divide-y divide-border border-t border-border">
              {topic.subtopics.map((sub) => (
                <SubtopicRow
                  key={sub.id}
                  sub={sub}
                  accent={c.ring}
                  status={statusOf(sub.id, progress)}
                  onToggle={() => cycleStatus(sub.id)}
                  links={getLinks(sub)}
                  onAddLink={() => onAddLink(sub.id)}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function SubtopicRow({
  sub,
  status,
  accent,
  onToggle,
  links,
  onAddLink,
}: {
  sub: Subtopic;
  status: ReturnType<typeof statusOf>;
  accent: string;
  onToggle: () => void;
  links: Resource[];
  onAddLink: () => void;
}) {
  return (
    <li className="group flex items-center gap-3 px-4 py-3 pl-11 hover:bg-muted/20">
      <StatusToggle status={status} onClick={onToggle} accent={accent} />
      <span
        className={cn(
          "flex-1 text-sm",
          status === "done" && "text-muted-foreground line-through",
        )}
      >
        {sub.title}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((r) => {
          const isUser = r.source === "user";
          const label = r.title.split(/[:(]/)[0].trim().slice(0, 22);
          const cls = cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
            isUser
              ? "border-transparent bg-violet-500/15 text-violet-200"
              : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
          );
          return r.url ? (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className={cls} title={r.title}>
              {isUser && <Link2 className="h-3 w-3" />}
              {label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span key={r.id} className={cls} title={r.title}>
              {isUser && <Link2 className="h-3 w-3" />}
              {label}
            </span>
          );
        })}
        <button
          onClick={onAddLink}
          title="Attach a link to this subtopic"
          aria-label="Attach a link to this subtopic"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
