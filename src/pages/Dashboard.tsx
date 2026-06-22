import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Upload, ArrowRight, Flame, CheckCircle2, Layers } from "lucide-react";
import { PILLAR_PALETTE } from "@/data/types";
import { useProgressContext } from "@/hooks/ProgressContext";
import { useResourcesContext } from "@/hooks/ResourcesContext";
import { useCurriculumContext } from "@/hooks/CurriculumContext";
import {
  overallStats,
  pillarStats,
  topicStats,
  topicCounts,
} from "@/lib/progress";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ProgressRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PillarIcon } from "@/components/PillarIcon";

export function Dashboard() {
  const { progress, mergeProgress } = useProgressContext();
  const { store: resourceStore, mergeStore } = useResourcesContext();
  const { curriculum, replaceCurriculum } = useCurriculumContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportAll = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      resources: resourceStore,
      curriculum,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studytracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = (parsed: unknown) => {
    if (!parsed || typeof parsed !== "object") throw new Error("bad file");
    const obj = parsed as Record<string, unknown>;
    if ("progress" in obj || "resources" in obj || "curriculum" in obj) {
      // New combined backup format.
      mergeProgress((obj.progress ?? {}) as Record<string, never>);
      mergeStore((obj.resources ?? {}) as Parameters<typeof mergeStore>[0]);
      // Curriculum is structural — replace it when the backup includes one.
      if (Array.isArray(obj.curriculum)) replaceCurriculum(obj.curriculum as Parameters<typeof replaceCurriculum>[0]);
    } else {
      // Legacy: a flat progress-only map.
      mergeProgress(obj as Record<string, never>);
    }
  };

  const overall = overallStats(curriculum, progress);
  const topics = topicCounts(curriculum, progress);

  const subtopicsDone = curriculum
    .flatMap((p) => p.topics.flatMap((t) => t.subtopics))
    .filter((s) => progress[s.id] === "done").length;
  const subtopicsTotal = curriculum.flatMap((p) =>
    p.topics.flatMap((t) => t.subtopics),
  ).length;

  // Topics currently in progress (not fully done, some activity).
  const studying = curriculum.flatMap((p) =>
    p.topics
      .map((t) => ({ pillar: p, topic: t, stats: topicStats(t, progress) }))
      .filter((x) => x.stats.status === "in-progress"),
  );

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importAll(JSON.parse(String(reader.result)));
        } catch {
          alert("Could not import that file — make sure it's a StudyTracker backup.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Your ML engineering study progress at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportAll}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm font-medium hover:bg-muted"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImport}
          />
        </div>
      </div>

      {/* Top summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-5 p-6">
          <ProgressRing
            value={overall.percent}
            from="#8b5cf6"
            to="#06b6d4"
            sublabel="complete"
          />
          <div>
            <div className="text-sm text-muted-foreground">Overall progress</div>
            <div className="mt-1 text-sm">
              In-progress counts as half. Keep the momentum going.
            </div>
          </div>
        </Card>

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Topics completed"
          value={`${topics.done} / ${topics.total}`}
          accent="#34d399"
        />
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          label="Subtopics done"
          value={`${subtopicsDone} / ${subtopicsTotal}`}
          accent="#22d3ee"
        />
      </div>

      {/* Pillars */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Pillars</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curriculum.map((pillar, i) => {
            const stats = pillarStats(pillar, progress);
            const c = PILLAR_PALETTE[pillar.color];
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to="/curriculum" state={{ pillarId: pillar.id }}>
                  <Card className="group h-full p-5 hover:border-muted-foreground/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                          style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                        >
                          <PillarIcon name={pillar.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold leading-tight">{pillar.title}</div>
                          <div className="text-xs text-muted-foreground">{pillar.blurb}</div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums" style={{ color: c.text }}>
                        {stats.percent}%
                      </span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={stats.percent} from={c.from} to={c.to} />
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{stats.done} / {stats.total} subtopics</span>
                        <span className="inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          Open <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Currently studying */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Flame className="h-5 w-5 text-amber-400" /> Currently studying
        </h2>
        {studying.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Nothing in progress yet. Head to the{" "}
            <Link to="/curriculum" className="font-medium text-foreground underline">
              Curriculum
            </Link>{" "}
            and mark a subtopic as in-progress.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {studying.map(({ pillar, topic, stats }) => {
              const c = PILLAR_PALETTE[pillar.color];
              return (
                <Card key={topic.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{topic.title}</div>
                      <div className="text-xs" style={{ color: c.text }}>{pillar.title}</div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {stats.percent}%
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={stats.percent} from={c.from} to={c.to} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-6">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
        style={{ background: `${accent}22`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}
