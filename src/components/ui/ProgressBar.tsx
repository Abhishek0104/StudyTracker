import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0–100
  from?: string;
  to?: string;
  className?: string;
}

export function ProgressBar({
  value,
  from = "#8b5cf6",
  to = "#06b6d4",
  className = "",
}: ProgressBarProps) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted/60 ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
