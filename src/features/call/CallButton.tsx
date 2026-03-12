import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CallButtonProps {
  icon: ReactNode;
  label: string;
  variant?: "default" | "danger" | "subtle";
  active?: boolean;
  onClick?: () => void;
}

export function CallButton({
  icon,
  label,
  variant = "default",
  active,
  onClick,
}: CallButtonProps) {
  const baseCircleClasses =
    "h-14 w-14 rounded-full flex items-center justify-center transition-colors shadow-md";

  const variantClasses =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : variant === "subtle"
        ? "bg-white/10 hover:bg-white/20 text-white/90"
        : "bg-white text-slate-900 hover:bg-slate-100";

  const activeRing =
    active && variant !== "danger"
      ? "ring-2 ring-offset-2 ring-offset-slate-900/80 ring-emerald-400"
      : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className={cn(
          "p-0 border-0 bg-transparent hover:bg-transparent focus-visible:ring-0 focus-visible:outline-none",
        )}
      >
        <div className={cn(baseCircleClasses, variantClasses, activeRing)}>
          {icon}
        </div>
      </Button>
      <span className="text-xs text-white/80 py-2">{label}</span>
    </div>
  );
}
