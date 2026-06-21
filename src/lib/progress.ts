import type { Pillar, Status, Topic } from "@/data/types";

export type ProgressMap = Record<string, Status>;

export interface Stats {
  total: number;
  done: number;
  inProgress: number;
  /** 0–100, where in-progress counts as half. */
  percent: number;
  /** Strict completion: done / total, 0–100. */
  percentDone: number;
  /** Rolled-up status for a topic/pillar. */
  status: Status;
}

const score = (s: Status): number => (s === "done" ? 1 : s === "in-progress" ? 0.5 : 0);

export function statusOf(id: string, progress: ProgressMap): Status {
  return progress[id] ?? "not-started";
}

function summarize(ids: string[], progress: ProgressMap): Stats {
  const total = ids.length;
  let done = 0;
  let inProgress = 0;
  let weighted = 0;

  for (const id of ids) {
    const s = statusOf(id, progress);
    if (s === "done") done++;
    else if (s === "in-progress") inProgress++;
    weighted += score(s);
  }

  const percent = total === 0 ? 0 : Math.round((weighted / total) * 100);
  const percentDone = total === 0 ? 0 : Math.round((done / total) * 100);

  let status: Status = "not-started";
  if (total > 0 && done === total) status = "done";
  else if (done > 0 || inProgress > 0) status = "in-progress";

  return { total, done, inProgress, percent, percentDone, status };
}

export function topicStats(topic: Topic, progress: ProgressMap): Stats {
  return summarize(
    topic.subtopics.map((s) => s.id),
    progress,
  );
}

export function pillarStats(pillar: Pillar, progress: ProgressMap): Stats {
  const ids = pillar.topics.flatMap((t) => t.subtopics.map((s) => s.id));
  return summarize(ids, progress);
}

export function overallStats(pillars: Pillar[], progress: ProgressMap): Stats {
  const ids = pillars.flatMap((p) => p.topics.flatMap((t) => t.subtopics.map((s) => s.id)));
  return summarize(ids, progress);
}

/** Count of topics (across all pillars) that are fully done / total. */
export function topicCounts(pillars: Pillar[], progress: ProgressMap) {
  const all = pillars.flatMap((p) => p.topics);
  const done = all.filter((t) => topicStats(t, progress).status === "done").length;
  return { done, total: all.length };
}
