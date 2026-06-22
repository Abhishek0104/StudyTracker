import { useEffect, useState } from "react";
import { useCurriculumContext } from "@/hooks/CurriculumContext";
import { suggestTitle } from "@/lib/urlTitle";
import type { ReadingStatus, Resource, ResourceType } from "@/data/types";
import type { ResourceDraft } from "@/hooks/useResources";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input, Label, Select, Textarea } from "./ui/Field";

const TYPES: ResourceType[] = ["web", "book", "course", "practice"];
const STATUSES: { value: ReadingStatus; label: string }[] = [
  { value: "to-read", label: "To read" },
  { value: "reading", label: "Reading" },
  { value: "done", label: "Done" },
];

export interface ResourceFormResult {
  draft: ResourceDraft;
  status: ReadingStatus | "none";
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog is in edit mode. */
  initial?: Resource;
  initialStatus?: ReadingStatus;
  /** Preselect a subtopic (used when adding from the Curriculum view). */
  initialSubtopicId?: string;
  onSubmit: (result: ResourceFormResult) => void;
}

const blank = {
  title: "",
  url: "",
  type: "web" as ResourceType,
  pillarId: "",
  subtopicId: "",
  author: "",
  note: "",
  tags: "",
  status: "to-read" as ReadingStatus | "none",
};

export function ResourceFormDialog({
  open,
  onClose,
  initial,
  initialStatus,
  initialSubtopicId,
  onSubmit,
}: Props) {
  const { curriculum } = useCurriculumContext();
  const [form, setForm] = useState(blank);

  // Sync form when (re)opening.
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        url: initial.url ?? "",
        type: initial.type,
        pillarId: initial.pillarIds[0] ?? "",
        subtopicId: initial.subtopicIds?.[0] ?? "",
        author: initial.author ?? "",
        note: initial.note ?? "",
        tags: (initial.tags ?? []).join(", "),
        status: initialStatus ?? "none",
      });
    } else {
      setForm({ ...blank, subtopicId: initialSubtopicId ?? "" });
    }
  }, [open, initial, initialStatus, initialSubtopicId]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const draft: ResourceDraft = {
      title: form.title.trim(),
      type: form.type,
      pillarIds: form.pillarId ? [form.pillarId] : [],
      ...(form.subtopicId ? { subtopicIds: [form.subtopicId] } : {}),
      ...(form.url.trim() ? { url: form.url.trim() } : {}),
      ...(form.author.trim() ? { author: form.author.trim() } : {}),
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
      ...(form.tags.trim()
        ? { tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }
        : {}),
    };
    onSubmit({ draft, status: form.status });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={initial ? "Edit resource" : "Add resource"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Title *</Label>
          <Input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. The Illustrated Transformer"
          />
        </div>

        <div>
          <Label>URL</Label>
          <Input
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            onBlur={() => {
              if (!form.title.trim() && form.url.trim()) {
                const suggestion = suggestTitle(form.url);
                if (suggestion) set("title", suggestion);
              }
            }}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => set("type", e.target.value as ResourceType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Pillar</Label>
            <Select value={form.pillarId} onChange={(e) => set("pillarId", e.target.value)}>
              <option value="">— None —</option>
              {curriculum.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Reading status</Label>
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value as ReadingStatus | "none")}
            >
              <option value="none">— None —</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="attention, must-read"
            />
          </div>
        </div>

        <div>
          <Label>Attach to subtopic (optional)</Label>
          <Select value={form.subtopicId} onChange={(e) => set("subtopicId", e.target.value)}>
            <option value="">— None —</option>
            {curriculum.flatMap((p) =>
              p.topics.map((t) => (
                <optgroup key={t.id} label={`${p.title} › ${t.title}`}>
                  {t.subtopics.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </optgroup>
              )),
            )}
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Shows this link inline on that subtopic in the Curriculum view.
          </p>
        </div>

        <div>
          <Label>Note</Label>
          <Textarea
            rows={2}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Why you saved this / what it covers"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!form.title.trim()}>
            {initial ? "Save changes" : "Add resource"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
