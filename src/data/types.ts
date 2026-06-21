export type Status = "not-started" | "in-progress" | "done";

export interface Subtopic {
  id: string;
  title: string;
  /** Resource ids (see resources.ts) that cover this subtopic. */
  resourceIds?: string[];
  notes?: string;
}

export interface Topic {
  id: string;
  title: string;
  subtopics: Subtopic[];
}

export interface Pillar {
  id: string;
  title: string;
  /** Short tagline shown under the title. */
  blurb: string;
  /** Tailwind-friendly accent, e.g. "violet". Used for gradients/rings. */
  color: PillarColor;
  /** lucide-react icon name. */
  icon: string;
  topics: Topic[];
}

export type PillarColor =
  | "violet"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose";

export type ResourceType = "book" | "course" | "web" | "practice";

/** Reading-list status for the idea hub / read-later flow. */
export type ReadingStatus = "to-read" | "reading" | "done";

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;
  author?: string;
  /** Pillars this resource serves. */
  pillarIds: string[];
  note?: string;
  /** Free-form tags (e.g. "attention", "must-read"). */
  tags?: string[];
  /** Subtopic ids this resource is attached to (shows inline in the curriculum). */
  subtopicIds?: string[];
  /** "seed" = from resources.ts, "user" = added in the app. Set at merge time. */
  source?: "seed" | "user";
}

/** Maps a PillarColor to concrete hsl values used by rings/gradients. */
export const PILLAR_PALETTE: Record<
  PillarColor,
  { from: string; to: string; ring: string; text: string; soft: string }
> = {
  violet: {
    from: "#8b5cf6",
    to: "#6366f1",
    ring: "#a78bfa",
    text: "#c4b5fd",
    soft: "rgba(139,92,246,0.14)",
  },
  cyan: {
    from: "#06b6d4",
    to: "#0ea5e9",
    ring: "#22d3ee",
    text: "#a5f3fc",
    soft: "rgba(6,182,212,0.14)",
  },
  emerald: {
    from: "#10b981",
    to: "#22c55e",
    ring: "#34d399",
    text: "#a7f3d0",
    soft: "rgba(16,185,129,0.14)",
  },
  amber: {
    from: "#f59e0b",
    to: "#f97316",
    ring: "#fbbf24",
    text: "#fde68a",
    soft: "rgba(245,158,11,0.14)",
  },
  rose: {
    from: "#f43f5e",
    to: "#ec4899",
    ring: "#fb7185",
    text: "#fecdd3",
    soft: "rgba(244,63,94,0.14)",
  },
};
