import { cn } from "@omnia/ui";
import type { ReactNode } from "react";

import type { UiStateTone } from "@/features/uat/operational-copy";

const toneClasses: Record<UiStateTone, string> = {
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-line bg-slate-50 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function UiStatePanel({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: UiStateTone;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 text-sm", toneClasses[tone], className)}>
      {children}
    </div>
  );
}

export function InlineFeedback({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: UiStateTone;
}) {
  return (
    <div className={cn("rounded-2xl border px-3 py-2 text-sm", toneClasses[tone], className)}>
      {children}
    </div>
  );
}
