import { createContext, useContext, type ReactNode } from "react";
import { useCurriculum } from "./useCurriculum";

type CurriculumContextValue = ReturnType<typeof useCurriculum>;

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const value = useCurriculum();
  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurriculumContext() {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error("useCurriculumContext must be used within CurriculumProvider");
  return ctx;
}
