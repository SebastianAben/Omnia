import { type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary:
      "bg-slate-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_24px_-18px_rgba(15,23,42,0.9)] hover:bg-slate-800",
    secondary:
      "border border-slate-200 bg-white text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold tracking-[-0.01em] transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-[-0.01em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
