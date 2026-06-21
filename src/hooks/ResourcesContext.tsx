import { createContext, useContext, type ReactNode } from "react";
import { useResources } from "./useResources";

type ResourcesContextValue = ReturnType<typeof useResources>;

const ResourcesContext = createContext<ResourcesContextValue | null>(null);

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const value = useResources();
  return <ResourcesContext.Provider value={value}>{children}</ResourcesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResourcesContext() {
  const ctx = useContext(ResourcesContext);
  if (!ctx) throw new Error("useResourcesContext must be used within ResourcesProvider");
  return ctx;
}
