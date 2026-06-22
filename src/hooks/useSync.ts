import { useCallback, useEffect, useRef, useState } from "react";
import { getFile, putFile, verify, SyncError, type SyncConfig } from "@/lib/githubSync";
import { useProgressContext } from "./ProgressContext";
import { useResourcesContext } from "./ResourcesContext";
import { useCurriculumContext } from "./CurriculumContext";
import type { ProgressMap } from "@/lib/progress";
import type { ResourceStore } from "./useResources";
import type { Pillar } from "@/data/types";

const CONFIG_KEY = "studytracker.sync.v1";
const META_KEY = "studytracker.meta.v1";
const PUSH_DEBOUNCE_MS = 3000;

export type SyncStatus = "disconnected" | "idle" | "syncing" | "offline" | "error";

interface SyncDoc {
  version: number;
  updatedAt: string;
  progress: ProgressMap;
  resources: ResourceStore;
  curriculum: Pillar[];
}

export const DEFAULT_CONFIG: SyncConfig = {
  token: "",
  owner: "",
  repo: "",
  path: "studytracker-data.json",
  branch: "main",
};

function loadConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.owner && parsed?.repo) {
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadMeta(): string {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return (JSON.parse(raw).updatedAt as string) ?? "";
  } catch {
    /* ignore */
  }
  return "";
}

function saveMeta(updatedAt: string) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ updatedAt }));
  } catch {
    /* ignore */
  }
}

const now = () => new Date().toISOString();
const isNetworkError = (e: unknown) => e instanceof TypeError; // fetch throws TypeError when offline

export function useSync() {
  const { progress, replaceProgress } = useProgressContext();
  const { store, replaceStore } = useResourcesContext();
  const { curriculum, replaceCurriculum } = useCurriculumContext();

  const [config, setConfig] = useState<SyncConfig | null>(loadConfig);
  const [status, setStatus] = useState<SyncStatus>(config ? "idle" : "disconnected");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Refs hold the latest values so async/debounced callbacks never go stale.
  const progressRef = useRef(progress);
  const storeRef = useRef(store);
  const curriculumRef = useRef(curriculum);
  const configRef = useRef(config);
  const shaRef = useRef<string | null>(null);
  const metaRef = useRef<string>(loadMeta());
  const suppressTouchRef = useRef(false); // skip the change triggered by applying remote
  const firstRunRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);
  useEffect(() => {
    curriculumRef.current = curriculum;
  }, [curriculum]);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const setLocalUpdatedAt = (ts: string) => {
    metaRef.current = ts;
    saveMeta(ts);
  };

  /** Apply a remote document to local state (last-write-wins). Returns true if applied. */
  const applyRemote = useCallback(
    (doc: SyncDoc): boolean => {
      const remoteNewer = !metaRef.current || doc.updatedAt > metaRef.current;
      if (!remoteNewer) return false;
      suppressTouchRef.current = true;
      replaceProgress(doc.progress ?? {});
      replaceStore(doc.resources ?? { user: [], status: {} });
      if (Array.isArray(doc.curriculum)) replaceCurriculum(doc.curriculum);
      setLocalUpdatedAt(doc.updatedAt);
      return true;
    },
    [replaceProgress, replaceStore, replaceCurriculum],
  );

  const pull = useCallback(async (): Promise<{ existed: boolean }> => {
    const cfg = configRef.current;
    if (!cfg) return { existed: false };
    setStatus("syncing");
    setLastError(null);
    try {
      const file = await getFile(cfg);
      if (!file) {
        shaRef.current = null;
        setStatus("idle");
        return { existed: false };
      }
      shaRef.current = file.sha;
      const doc = JSON.parse(file.content) as SyncDoc;
      applyRemote(doc);
      setLastSyncedAt(now());
      setStatus("idle");
      return { existed: true };
    } catch (e) {
      if (isNetworkError(e)) setStatus("offline");
      else {
        setStatus("error");
        setLastError(e instanceof Error ? e.message : "Pull failed");
      }
      throw e;
    }
  }, [applyRemote]);

  const push = useCallback(async (): Promise<void> => {
    const cfg = configRef.current;
    if (!cfg) return;
    setStatus("syncing");
    setLastError(null);
    const capturedUpdatedAt = metaRef.current || now();
    setLocalUpdatedAt(capturedUpdatedAt);
    const doc: SyncDoc = {
      version: 1,
      updatedAt: capturedUpdatedAt,
      progress: progressRef.current,
      resources: storeRef.current,
      curriculum: curriculumRef.current,
    };
    const json = JSON.stringify(doc, null, 2);
    try {
      try {
        const { sha } = await putFile(cfg, json, shaRef.current, "Update StudyTracker data");
        shaRef.current = sha;
      } catch (e) {
        if (e instanceof SyncError && e.status === 409) {
          // Remote changed under us: pull, then re-push only if our edit is still newest.
          await pull();
          if (metaRef.current === capturedUpdatedAt) {
            const { sha } = await putFile(cfg, json, shaRef.current, "Update StudyTracker data");
            shaRef.current = sha;
          }
        } else {
          throw e;
        }
      }
      setLastSyncedAt(now());
      setStatus("idle");
    } catch (e) {
      if (isNetworkError(e)) setStatus("offline");
      else {
        setStatus("error");
        setLastError(e instanceof Error ? e.message : "Push failed");
      }
      throw e;
    }
  }, [pull]);

  const schedulePush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void push().catch(() => {
        /* status already reflects the failure */
      });
    }, PUSH_DEBOUNCE_MS);
  }, [push]);

  // Watch local data; push genuine edits (skip the change caused by applying remote).
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    if (suppressTouchRef.current) {
      suppressTouchRef.current = false;
      return;
    }
    if (!configRef.current) return;
    setLocalUpdatedAt(now());
    schedulePush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, store, curriculum]);

  const connect = useCallback(
    async (cfg: SyncConfig): Promise<{ login: string }> => {
      setStatus("syncing");
      setLastError(null);
      try {
        const result = await verify(cfg);
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
        setConfig(cfg);
        configRef.current = cfg;
        // Pull remote; if no remote file yet but we have local data, create it.
        const { existed } = await pull();
        const hasLocal =
          Object.keys(progressRef.current).length > 0 || storeRef.current.user.length > 0;
        if (!existed && hasLocal) {
          if (!metaRef.current) setLocalUpdatedAt(now());
          await push();
        }
        return result;
      } catch (e) {
        if (!isNetworkError(e) && !(e instanceof SyncError)) {
          setStatus("error");
        }
        throw e;
      }
    },
    [pull, push],
  );

  const disconnect = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    localStorage.removeItem(CONFIG_KEY);
    setConfig(null);
    configRef.current = null;
    shaRef.current = null;
    setStatus("disconnected");
    setLastSyncedAt(null);
    setLastError(null);
  }, []);

  const syncNow = useCallback(async () => {
    await pull();
    await push();
  }, [pull, push]);

  // Auto-pull on mount if already connected, and re-sync when coming back online.
  useEffect(() => {
    if (configRef.current) void pull().catch(() => {});
    const onOnline = () => {
      if (configRef.current) void syncNow().catch(() => {});
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    config,
    connected: !!config,
    status,
    lastSyncedAt,
    lastError,
    connect,
    disconnect,
    pull,
    push,
    syncNow,
  };
}
