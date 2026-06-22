import {
  Sigma,
  Brain,
  Network,
  Sparkles,
  Binary,
  BookOpen,
  Code2,
  Database,
  Cpu,
  FlaskConical,
  Atom,
  Boxes,
  LineChart,
  Workflow,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Sigma,
  Brain,
  Network,
  Sparkles,
  Binary,
  BookOpen,
  Code2,
  Database,
  Cpu,
  FlaskConical,
  Atom,
  Boxes,
  LineChart,
  Workflow,
};

/** Icon names offered in the subject (pillar) icon picker. */
export const PILLAR_ICON_CHOICES = Object.keys(MAP);

export function PillarIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? BookOpen;
  return <Icon className={className} />;
}
