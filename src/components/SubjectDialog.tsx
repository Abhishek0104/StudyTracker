import { useEffect, useState } from "react";
import { PILLAR_PALETTE, type Pillar, type PillarColor } from "@/data/types";
import type { NewPillar } from "@/hooks/useCurriculum";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input, Label } from "./ui/Field";
import { PillarIcon, PILLAR_ICON_CHOICES } from "./PillarIcon";
import { cn } from "@/lib/utils";

const COLORS = Object.keys(PILLAR_PALETTE) as PillarColor[];

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this pillar; otherwise it adds a new one. */
  initial?: Pillar;
  onSubmit: (data: NewPillar) => void;
}

const blank: NewPillar = { title: "", blurb: "", color: "violet", icon: "BookOpen" };

export function SubjectDialog({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<NewPillar>(blank);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? { title: initial.title, blurb: initial.blurb, color: initial.color, icon: initial.icon }
        : blank,
    );
  }, [open, initial]);

  const set = <K extends keyof NewPillar>(k: K, v: NewPillar[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({ ...form, title: form.title.trim(), blurb: form.blurb.trim() });
    onClose();
  };

  const palette = PILLAR_PALETTE[form.color];

  return (
    <Dialog open={open} onClose={onClose} title={initial ? "Edit subject" : "Add subject"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Name *</Label>
          <Input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. MLOps"
          />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input
            value={form.blurb}
            onChange={(e) => set("blurb", e.target.value)}
            placeholder="e.g. Shipping & operating ML systems"
          />
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex gap-2">
            {COLORS.map((c) => {
              const pal = PILLAR_PALETTE[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  aria-label={c}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                    form.color === c && "ring-2 ring-white",
                  )}
                  style={{ background: `linear-gradient(135deg, ${pal.from}, ${pal.to})` }}
                />
              );
            })}
          </div>
        </div>

        <div>
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-2">
            {PILLAR_ICON_CHOICES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => set("icon", name)}
                aria-label={name}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                  form.icon === name
                    ? "border-transparent text-white"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
                style={form.icon === name ? { background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` } : undefined}
              >
                <PillarIcon name={name} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!form.title.trim()}>
            {initial ? "Save changes" : "Add subject"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
