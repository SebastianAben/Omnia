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
    <header className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 text-sm">
      <div className="flex min-w-0 items-center gap-3">
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

      <div className="flex items-center gap-3 text-slate-600">
        <Badge tone={isOnline ? "success" : "danger"}>
          <Cloud size={12} aria-hidden="true" />
          {isOnline ? "Online" : "Offline"}
        </Badge>
        <Badge tone={pendingSyncCount > 0 ? "warning" : "success"}>
          <RefreshCcw size={12} aria-hidden="true" />
          {pendingSyncCount} pending
        </Badge>
        <div className="flex items-center gap-2">
          <UserRound size={16} aria-hidden="true" />
          <span>{user.fullName}</span>
          <span className="text-slate-400">({roleLabels[role]})</span>
        </div>
      </div>
    </header>
  );
}
