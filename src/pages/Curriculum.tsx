import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ExternalLink,
  Plus,
  Link2,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  PencilLine,
} from "lucide-react";
import { PILLAR_PALETTE, type Pillar, type Resource, type Subtopic } from "@/data/types";
import { useProgressContext } from "@/hooks/ProgressContext";
import { useResourcesContext } from "@/hooks/ResourcesContext";
import { useCurriculumContext } from "@/hooks/CurriculumContext";
import type { NewPillar } from "@/hooks/useCurriculum";
import { pillarStats, statusOf, topicStats } from "@/lib/progress";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ProgressRing";
import { StatusToggle } from "@/components/StatusToggle";
import { PillarIcon } from "@/components/PillarIcon";
import { ResourceFormDialog, type ResourceFormResult } from "@/components/ResourceFormDialog";
import { SubjectDialog } from "@/components/SubjectDialog";
import { cn } from "@/lib/utils";

export function Curriculum() {
  const location = useLocation();
  const {
    curriculum,
    addPillar,
    updatePillar,
    deletePillar,
    movePillar,
    addTopic,
    updateTopic,
    deleteTopic,
    moveTopic,
    addSubtopic,
    updateSubtopic,
    deleteSubtopic,
    moveSubtopic,
  } = useCurriculumContext();
  const { progress, cycleStatus, removeProgressKeys } = useProgressContext();
  const { allResources, addResource, setStatus, detachSubtopicIds } = useResourcesContext();

  const statePillar = (location.state as { pillarId?: string } | null)?.pillarId;
  const [activeId, setActiveId] = useState<string | undefined>(statePillar ?? curriculum[0]?.id);
  const [editMode, setEditMode] = useState(false);

  // Keep the active pillar valid as the curriculum changes.
  useEffect(() => {
    if (!curriculum.some((p) => p.id === activeId)) {
      setActiveId(curriculum[0]?.id);
    }
  }, [curriculum, activeId]);

  // Resolve resources attached to a subtopic (seed via resourceIds + user via subtopicIds).
  const resourceById = useMemo(() => new Map(allResources.map((r) => [r.id, r])), [allResources]);
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
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [pendingSubtopic, setPendingSubtopic] = useState<string | undefined>(undefined);
  const onAddLink = (subtopicId: string) => {
    setPendingSubtopic(subtopicId);
    setLinkDialogOpen(true);
  };
  const handleLinkSubmit = (result: ResourceFormResult) => {
    const id = addResource(result.draft);
    setStatus(id, result.status);
  };

  // Subject (pillar) add/edit dialog.
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<Pillar | undefined>(undefined);
  const openAddSubject = () => {
    setEditingPillar(undefined);
    setSubjectDialogOpen(true);
  };
  const openEditSubject = (p: Pillar) => {
    setEditingPillar(p);
    setSubjectDialogOpen(true);
  };
  const handleSubjectSubmit = (data: NewPillar) => {
    if (editingPillar) updatePillar(editingPillar.id, data);
    else {
      const id = addPillar(data);
      setActiveId(id);
    }
  };

  // ---- Deletes with orphan cleanup ----
  const cleanup = (ids: string[]) => {
    removeProgressKeys(ids);
    detachSubtopicIds(ids);
  };
  const handleDeletePillar = (p: Pillar) => {
    if (!confirm(`Delete "${p.title}" and all its topics? This can't be undone.`)) return;
    cleanup(p.topics.flatMap((t) => t.subtopics.map((s) => s.id)));
    deletePillar(p.id);
  };
  const handleDeleteTopic = (t: Pillar["topics"][number]) => {
    if (!confirm(`Delete topic "${t.title}"?`)) return;
    cleanup(t.subtopics.map((s) => s.id));
    deleteTopic(t.id);
  };
  const handleDeleteSubtopic = (sub: Subtopic) => {
    if (!confirm(`Delete "${sub.title}"?`)) return;
    cleanup([sub.id]);
    deleteSubtopic(sub.id);
  };

  const pillar = curriculum.find((p) => p.id === activeId) ?? curriculum[0];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
          <p className="mt-1 text-muted-foreground">
            {editMode
              ? "Editing — add, rename, reorder, or remove subjects, topics and subtopics."
              : "The complete picture. Click a status dot to cycle Not started → In progress → Done."}
          </p>
        </div>
        <Button
          variant={editMode ? "primary" : "secondary"}
          onClick={() => setEditMode((e) => !e)}
        >
          {editMode ? <Check className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
          {editMode ? "Done" : "Edit"}
        </Button>
      </div>

      {curriculum.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-muted-foreground">No subjects yet.</p>
          <Button variant="primary" onClick={openAddSubject}>
            <Plus className="h-4 w-4" /> Add your first subject
          </Button>
        </Card>
      ) : (
        <>
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
            {editMode && (
              <button
                onClick={openAddSubject}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> Add subject
              </button>
            )}
          </div>

          {pillar && (
            <PillarPanel
              pillar={pillar}
              editMode={editMode}
              isFirst={curriculum[0]?.id === pillar.id}
              isLast={curriculum[curriculum.length - 1]?.id === pillar.id}
              progress={progress}
              getLinks={getLinks}
              onAddLink={onAddLink}
              onCycleStatus={cycleStatus}
              onMovePillar={(dir) => movePillar(pillar.id, dir)}
              onEditPillar={() => openEditSubject(pillar)}
              onDeletePillar={() => handleDeletePillar(pillar)}
              onAddTopic={(title) => addTopic(pillar.id, title)}
              onRenameTopic={(id, title) => updateTopic(id, { title })}
              onDeleteTopic={handleDeleteTopic}
              onMoveTopic={moveTopic}
              onAddSubtopic={(topicId, title) => addSubtopic(topicId, title)}
              onRenameSubtopic={(id, title) => updateSubtopic(id, { title })}
              onDeleteSubtopic={handleDeleteSubtopic}
              onMoveSubtopic={moveSubtopic}
            />
          )}
        </>
      )}

      <ResourceFormDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        initialSubtopicId={pendingSubtopic}
        onSubmit={handleLinkSubmit}
      />
      <SubjectDialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        initial={editingPillar}
        onSubmit={handleSubjectSubmit}
      />
    </div>
  );
}

interface PillarPanelProps {
  pillar: Pillar;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  progress: ReturnType<typeof useProgressContext>["progress"];
  getLinks: (sub: Subtopic) => Resource[];
  onAddLink: (subtopicId: string) => void;
  onCycleStatus: (id: string) => void;
  onMovePillar: (dir: -1 | 1) => void;
  onEditPillar: () => void;
  onDeletePillar: () => void;
  onAddTopic: (title: string) => void;
  onRenameTopic: (id: string, title: string) => void;
  onDeleteTopic: (t: Pillar["topics"][number]) => void;
  onMoveTopic: (id: string, dir: -1 | 1) => void;
  onAddSubtopic: (topicId: string, title: string) => void;
  onRenameSubtopic: (id: string, title: string) => void;
  onDeleteSubtopic: (sub: Subtopic) => void;
  onMoveSubtopic: (id: string, dir: -1 | 1) => void;
}

function PillarPanel(props: PillarPanelProps) {
  const { pillar, editMode, isFirst, isLast } = props;
  const c = PILLAR_PALETTE[pillar.color];
  const stats = pillarStats(pillar, props.progress);

  return (
    <>
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

        {editMode && (
          <div className="flex items-center gap-1">
            <IconBtn label="Move left" onClick={() => props.onMovePillar(-1)} disabled={isFirst}>
              <ArrowLeft className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Move right" onClick={() => props.onMovePillar(1)} disabled={isLast}>
              <ArrowRight className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Edit subject" onClick={props.onEditPillar}>
              <Pencil className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Delete subject" onClick={props.onDeletePillar} danger>
              <Trash2 className="h-4 w-4" />
            </IconBtn>
          </div>
        )}
      </Card>

      {/* Topics */}
      <div className="space-y-3">
        {pillar.topics.map((topic, i) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            pillar={pillar}
            editMode={editMode}
            isFirst={i === 0}
            isLast={i === pillar.topics.length - 1}
            progress={props.progress}
            getLinks={props.getLinks}
            onAddLink={props.onAddLink}
            onCycleStatus={props.onCycleStatus}
            onRenameTopic={props.onRenameTopic}
            onDeleteTopic={props.onDeleteTopic}
            onMoveTopic={props.onMoveTopic}
            onAddSubtopic={props.onAddSubtopic}
            onRenameSubtopic={props.onRenameSubtopic}
            onDeleteSubtopic={props.onDeleteSubtopic}
            onMoveSubtopic={props.onMoveSubtopic}
          />
        ))}

        {editMode && <InlineAdd placeholder="Add a topic…" onAdd={props.onAddTopic} />}
      </div>
    </>
  );
}

function TopicRow({
  topic,
  pillar,
  editMode,
  isFirst,
  isLast,
  progress,
  getLinks,
  onAddLink,
  onCycleStatus,
  onRenameTopic,
  onDeleteTopic,
  onMoveTopic,
  onAddSubtopic,
  onRenameSubtopic,
  onDeleteSubtopic,
  onMoveSubtopic,
}: {
  topic: Pillar["topics"][number];
  pillar: Pillar;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  progress: PillarPanelProps["progress"];
  getLinks: (sub: Subtopic) => Resource[];
  onAddLink: (subtopicId: string) => void;
  onCycleStatus: (id: string) => void;
  onRenameTopic: (id: string, title: string) => void;
  onDeleteTopic: (t: Pillar["topics"][number]) => void;
  onMoveTopic: (id: string, dir: -1 | 1) => void;
  onAddSubtopic: (topicId: string, title: string) => void;
  onRenameSubtopic: (id: string, title: string) => void;
  onDeleteSubtopic: (sub: Subtopic) => void;
  onMoveSubtopic: (id: string, dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(true);
  const c = PILLAR_PALETTE[pillar.color];
  const stats = topicStats(topic, progress);

  return (
    <Card className="overflow-hidden">
      <div className="flex w-full items-center gap-3 p-4">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            {editMode ? (
              <EditableTitle value={topic.title} onSave={(v) => onRenameTopic(topic.id, v)} className="font-medium" />
            ) : (
              <button onClick={() => setOpen((o) => !o)} className="text-left font-medium">
                {topic.title}
              </button>
            )}
            {!editMode && (
              <span className="text-sm tabular-nums text-muted-foreground">
                {stats.done}/{stats.total}
              </span>
            )}
          </div>
          {!editMode && (
            <div className="mt-2">
              <ProgressBar value={stats.percent} from={c.from} to={c.to} />
            </div>
          )}
        </div>

        {editMode && (
          <div className="flex shrink-0 items-center gap-1">
            <IconBtn label="Move up" onClick={() => onMoveTopic(topic.id, -1)} disabled={isFirst}>
              <ArrowUp className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Move down" onClick={() => onMoveTopic(topic.id, 1)} disabled={isLast}>
              <ArrowDown className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Delete topic" onClick={() => onDeleteTopic(topic)} danger>
              <Trash2 className="h-4 w-4" />
            </IconBtn>
          </div>
        )}
      </div>

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
              {topic.subtopics.map((sub, i) => (
                <SubtopicRow
                  key={sub.id}
                  sub={sub}
                  accent={c.ring}
                  editMode={editMode}
                  isFirst={i === 0}
                  isLast={i === topic.subtopics.length - 1}
                  status={statusOf(sub.id, progress)}
                  onToggle={() => onCycleStatus(sub.id)}
                  links={getLinks(sub)}
                  onAddLink={() => onAddLink(sub.id)}
                  onRename={(v) => onRenameSubtopic(sub.id, v)}
                  onDelete={() => onDeleteSubtopic(sub)}
                  onMove={(dir) => onMoveSubtopic(sub.id, dir)}
                />
              ))}
            </ul>
            {editMode && (
              <div className="border-t border-border px-4 py-3 pl-11">
                <InlineAdd
                  placeholder="Add a subtopic…"
                  onAdd={(title) => onAddSubtopic(topic.id, title)}
                />
              </div>
            )}
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
  editMode,
  isFirst,
  isLast,
  onToggle,
  links,
  onAddLink,
  onRename,
  onDelete,
  onMove,
}: {
  sub: Subtopic;
  status: ReturnType<typeof statusOf>;
  accent: string;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  links: Resource[];
  onAddLink: () => void;
  onRename: (value: string) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <li className="group flex items-center gap-3 px-4 py-3 pl-11 hover:bg-muted/20">
      {!editMode && <StatusToggle status={status} onClick={onToggle} accent={accent} />}
      {editMode ? (
        <EditableTitle value={sub.title} onSave={onRename} className="flex-1 text-sm" />
      ) : (
        <span className={cn("flex-1 text-sm", status === "done" && "text-muted-foreground line-through")}>
          {sub.title}
        </span>
      )}

      {editMode ? (
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn label="Move up" onClick={() => onMove(-1)} disabled={isFirst}>
            <ArrowUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Move down" onClick={() => onMove(1)} disabled={isLast}>
            <ArrowDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Delete subtopic" onClick={onDelete} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      ) : (
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
      )}
    </li>
  );
}

/** Small square icon button used for the inline edit controls. */
function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30",
        danger && "hover:border-transparent hover:bg-rose-500/20 hover:text-rose-300",
      )}
    >
      {children}
    </button>
  );
}

/** Inline title editor: commits on Enter or blur, cancels on Escape. */
function EditableTitle({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  };

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(
        "w-full rounded-md border border-border bg-muted/40 px-2 py-1 outline-none focus:border-muted-foreground/60",
        className,
      )}
    />
  );
}

/** Inline "add" input that reveals from a button, commits on Enter/Add. */
function InlineAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") add();
          if (e.key === "Escape") setValue("");
        }}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-muted-foreground/60"
      />
      <Button variant="secondary" onClick={add} disabled={!value.trim()}>
        <Plus className="h-4 w-4" /> Add
      </Button>
      {value && (
        <button
          onClick={() => setValue("")}
          aria-label="Clear"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
