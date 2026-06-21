import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-transparent text-white bg-[linear-gradient(135deg,#8b5cf6,#06b6d4)] hover:opacity-90",
  secondary: "border-border bg-muted/40 text-foreground hover:bg-muted",
  ghost: "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
  danger: "border-transparent bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
};

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
