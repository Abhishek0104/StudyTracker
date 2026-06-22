import { useCallback, useEffect, useState } from "react";
import type { Status } from "@/data/types";
import type { ProgressMap } from "@/lib/progress";

const STORAGE_KEY = "studytracker.progress.v1";

const STATUS_CYCLE: Status[] = ["not-started", "in-progress", "done"];

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as ProgressMap;
  } catch {
    /* ignore corrupt storage */
  }
  return {};
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(load);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* storage may be full / unavailable */
    }
  }, [progress]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setProgress(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setStatus = useCallback((id: string, status: Status) => {
    setProgress((prev) => {
      const next = { ...prev };
      if (status === "not-started") delete next[id];
      else next[id] = status;
      return next;
    });
  }, []);

  const cycleStatus = useCallback((id: string) => {
    setProgress((prev) => {
      const current = prev[id] ?? "not-started";
      const idx = STATUS_CYCLE.indexOf(current);
      const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      const next = { ...prev };
      if (nextStatus === "not-started") delete next[id];
      else next[id] = nextStatus;
      return next;
    });
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `studytracker-progress-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [progress]);

  const importJSON = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!parsed || typeof parsed !== "object") throw new Error("bad shape");
          // Merge: imported values win.
          setProgress((prev) => ({ ...prev, ...(parsed as ProgressMap) }));
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }, []);

  const mergeProgress = useCallback((incoming: ProgressMap) => {
    if (!incoming || typeof incoming !== "object") return;
    setProgress((prev) => ({ ...prev, ...incoming }));
  }, []);

  /** Replace the entire progress map (used when applying remote sync state). */
  const replaceProgress = useCallback((incoming: ProgressMap) => {
    setProgress(incoming && typeof incoming === "object" ? incoming : {});
  }, []);

  /** Drop progress entries for the given subtopic ids (used when deleting curriculum items). */
  const removeProgressKeys = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setProgress((prev) => {
      const next = { ...prev };
      for (const id of ids) delete next[id];
      return next;
    });
  }, []);

  const reset = useCallback(() => setProgress({}), []);

  return {
    progress,
    setStatus,
    cycleStatus,
    exportJSON,
    importJSON,
    mergeProgress,
    replaceProgress,
    removeProgressKeys,
    reset,
  };
}
