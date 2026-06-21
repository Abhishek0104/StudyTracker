import {
  Sigma,
  Brain,
  Network,
  Sparkles,
  Binary,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Sigma,
  Brain,
  Network,
  Sparkles,
  Binary,
  BookOpen,
};

export function PillarIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? BookOpen;
  return <Icon className={className} />;
}
