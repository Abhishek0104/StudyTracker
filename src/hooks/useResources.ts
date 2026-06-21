import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadingStatus, Resource } from "@/data/types";
import { resources as seedResources } from "@/data/resources";

const STORAGE_KEY = "studytracker.resources.v1";

const STATUS_CYCLE: (ReadingStatus | "none")[] = ["none", "to-read", "reading", "done"];

/** Persisted shape: user-added resources + a reading-status map (covers seed + user ids). */
export interface ResourceStore {
  user: Resource[];
  status: Record<string, ReadingStatus>;
}

/** Fields the user fills in the Add/Edit form. */
export type ResourceDraft = Omit<Resource, "id" | "source">;

const EMPTY: ResourceStore = { user: [], status: {} };

function load(): ResourceStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        user: Array.isArray(parsed.user) ? parsed.user : [],
        status: parsed.status && typeof parsed.status === "object" ? parsed.status : {},
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return EMPTY;
}

function newId() {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useResources() {
  const [store, setStore] = useState<ResourceStore>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage unavailable */
    }
  }, [store]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setStore(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Seed resources + user resources, with `source` tagged. */
  const allResources = useMemo<Resource[]>(
    () => [
      ...seedResources.map((r) => ({ ...r, source: "seed" as const })),
      ...store.user.map((r) => ({ ...r, source: "user" as const })),
    ],
    [store.user],
  );

  const addResource = useCallback((draft: ResourceDraft) => {
    const id = newId();
    setStore((prev) => ({ ...prev, user: [...prev.user, { ...draft, id }] }));
    return id;
  }, []);

  const updateResource = useCallback((id: string, patch: Partial<ResourceDraft>) => {
    setStore((prev) => ({
      ...prev,
      user: prev.user.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteResource = useCallback((id: string) => {
    setStore((prev) => {
      const status = { ...prev.status };
      delete status[id];
      return { user: prev.user.filter((r) => r.id !== id), status };
    });
  }, []);

  const getStatus = useCallback(
    (id: string): ReadingStatus | undefined => store.status[id],
    [store.status],
  );

  const setStatus = useCallback((id: string, status: ReadingStatus | "none") => {
    setStore((prev) => {
      const next = { ...prev.status };
      if (status === "none") delete next[id];
      else next[id] = status;
      return { ...prev, status: next };
    });
  }, []);

  const cycleStatus = useCallback((id: string) => {
    setStore((prev) => {
      const current = prev.status[id] ?? "none";
      const idx = STATUS_CYCLE.indexOf(current);
      const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      const next = { ...prev.status };
      if (nextStatus === "none") delete next[id];
      else next[id] = nextStatus;
      return { ...prev, status: next };
    });
  }, []);

  /** Merge an imported store (used by backup import). */
  const mergeStore = useCallback((incoming: Partial<ResourceStore>) => {
    setStore((prev) => {
      const existingIds = new Set(prev.user.map((r) => r.id));
      const mergedUser = [
        ...prev.user,
        ...(incoming.user ?? []).filter((r) => !existingIds.has(r.id)),
      ];
      return {
        user: mergedUser,
        status: { ...prev.status, ...(incoming.status ?? {}) },
      };
    });
  }, []);

  /** Replace the entire store (used when applying remote sync state). */
  const replaceStore = useCallback((incoming: Partial<ResourceStore>) => {
    setStore({
      user: Array.isArray(incoming?.user) ? incoming.user : [],
      status: incoming?.status && typeof incoming.status === "object" ? incoming.status : {},
    });
  }, []);

  return {
    store,
    allResources,
    addResource,
    updateResource,
    deleteResource,
    getStatus,
    setStatus,
    cycleStatus,
    mergeStore,
    replaceStore,
  };
}
