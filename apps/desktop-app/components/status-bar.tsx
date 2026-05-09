"use client";

import { Badge } from "@omnia/ui";
import { Cloud, RefreshCcw, Store, UserRound } from "lucide-react";
import { roleLabels, useAppState } from "@/lib/app-state";

export function StatusBar() {
  const {
    branch,
    register,
    role,
    user,
    shiftStatus,
    isOnline,
    pendingSyncCount,
  } = useAppState();

  return (
    <header className="sticky top-0 z-20 flex min-h-14 flex-col gap-2 border-b border-line/80 bg-white/78 px-4 py-3 text-sm shadow-[0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-950">
          <Store size={16} aria-hidden="true" />
          <span className="truncate">{branch.name}</span>
        </div>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600">{register.name}</span>
        <Badge tone={shiftStatus === "open" ? "success" : "warning"}>
          Shift {shiftStatus}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-slate-600 md:gap-3">
        <Badge tone={isOnline ? "success" : "danger"}>
          <Cloud size={12} aria-hidden="true" />
          {isOnline ? "Online" : "Offline"}
        </Badge>
        <Badge tone={pendingSyncCount > 0 ? "warning" : "success"}>
          <RefreshCcw size={12} aria-hidden="true" />
          {pendingSyncCount} pending
        </Badge>
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-2.5 py-1.5">
          <UserRound size={16} aria-hidden="true" />
          <span className="font-medium text-slate-800">{user.fullName}</span>
          <span className="text-slate-400">{roleLabels[role]}</span>
        </div>
      </div>
    </header>
  );
}
