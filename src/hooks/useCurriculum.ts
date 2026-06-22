import { useCallback, useEffect, useState } from "react";
import type { Pillar, PillarColor, Subtopic, Topic } from "@/data/types";
import { curriculum as seedCurriculum } from "@/data/curriculum";

const STORAGE_KEY = "studytracker.curriculum.v1";

export interface NewPillar {
  title: string;
  blurb: string;
  color: PillarColor;
  icon: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function load(): Pillar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Pillar[];
    }
  } catch {
    /* ignore corrupt storage */
  }
  // First run (or corrupt): seed from the bundled default.
  return clone(seedCurriculum);
}

/** Move the item at `index` one slot in `dir` (-1 up / +1 down). Returns a new array. */
function moveInArray<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<Pillar[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(curriculum));
    } catch {
      /* storage unavailable */
    }
  }, [curriculum]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCurriculum(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- Pillars ----
  const addPillar = useCallback((p: NewPillar) => {
    const pillar: Pillar = { id: newId("pillar"), topics: [], ...p };
    setCurriculum((prev) => [...prev, pillar]);
    return pillar.id;
  }, []);

  const updatePillar = useCallback((id: string, patch: Partial<NewPillar>) => {
    setCurriculum((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deletePillar = useCallback((id: string) => {
    setCurriculum((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const movePillar = useCallback((id: string, dir: -1 | 1) => {
    setCurriculum((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      return i === -1 ? prev : moveInArray(prev, i, dir);
    });
  }, []);

  // ---- Topics ----
  const addTopic = useCallback((pillarId: string, title: string) => {
    const topic: Topic = { id: newId("topic"), title, subtopics: [] };
    setCurriculum((prev) =>
      prev.map((p) => (p.id === pillarId ? { ...p, topics: [...p.topics, topic] } : p)),
    );
    return topic.id;
  }, []);

  const updateTopic = useCallback((id: string, patch: Partial<Pick<Topic, "title">>) => {
    setCurriculum((prev) =>
      prev.map((p) => ({
        ...p,
        topics: p.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    );
  }, []);

  const deleteTopic = useCallback((id: string) => {
    setCurriculum((prev) =>
      prev.map((p) => ({ ...p, topics: p.topics.filter((t) => t.id !== id) })),
    );
  }, []);

  const moveTopic = useCallback((id: string, dir: -1 | 1) => {
    setCurriculum((prev) =>
      prev.map((p) => {
        const i = p.topics.findIndex((t) => t.id === id);
        return i === -1 ? p : { ...p, topics: moveInArray(p.topics, i, dir) };
      }),
    );
  }, []);

  // ---- Subtopics ----
  const addSubtopic = useCallback((topicId: string, title: string) => {
    const sub: Subtopic = { id: newId("sub"), title };
    setCurriculum((prev) =>
      prev.map((p) => ({
        ...p,
        topics: p.topics.map((t) =>
          t.id === topicId ? { ...t, subtopics: [...t.subtopics, sub] } : t,
        ),
      })),
    );
    return sub.id;
  }, []);

  const updateSubtopic = useCallback((id: string, patch: Partial<Pick<Subtopic, "title">>) => {
    setCurriculum((prev) =>
      prev.map((p) => ({
        ...p,
        topics: p.topics.map((t) => ({
          ...t,
          subtopics: t.subtopics.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      })),
    );
  }, []);

  const deleteSubtopic = useCallback((id: string) => {
    setCurriculum((prev) =>
      prev.map((p) => ({
        ...p,
        topics: p.topics.map((t) => ({
          ...t,
          subtopics: t.subtopics.filter((s) => s.id !== id),
        })),
      })),
    );
  }, []);

  const moveSubtopic = useCallback((id: string, dir: -1 | 1) => {
    setCurriculum((prev) =>
      prev.map((p) => ({
        ...p,
        topics: p.topics.map((t) => {
          const i = t.subtopics.findIndex((s) => s.id === id);
          return i === -1 ? t : { ...t, subtopics: moveInArray(t.subtopics, i, dir) };
        }),
      })),
    );
  }, []);

  /** Replace the whole curriculum (used when applying remote sync state). */
  const replaceCurriculum = useCallback((incoming: Pillar[]) => {
    if (Array.isArray(incoming)) setCurriculum(incoming);
  }, []);

  /** Reset to the bundled default curriculum. */
  const resetCurriculum = useCallback(() => setCurriculum(clone(seedCurriculum)), []);

  return {
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
    replaceCurriculum,
    resetCurriculum,
  };
}
