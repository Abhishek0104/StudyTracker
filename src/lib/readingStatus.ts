import type { ReadingStatus } from "@/data/types";

export const READING_STATUS_META: Record<
  ReadingStatus,
  { label: string; color: string; bg: string }
> = {
  "to-read": { label: "To read", color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
  reading: { label: "Reading", color: "#22d3ee", bg: "rgba(6,182,212,0.15)" },
  done: { label: "Done", color: "#34d399", bg: "rgba(16,185,129,0.15)" },
};

export const READING_STATUS_ORDER: ReadingStatus[] = ["to-read", "reading", "done"];
