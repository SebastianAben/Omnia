"use client";

import { Button, Badge } from "@omnia/ui";

import { WorkspacePanel } from "@/components/app-shell";
import { useAppState } from "@/lib/app-state";
import { listLocalSyncQueue } from "@/features/local-first/local-checkout-repository";

export function ShiftPanel() {
  const shiftStatus = useAppState((state) => state.shiftStatus);
  const setShiftStatus = useAppState((state) => state.setShiftStatus);
  const branch = useAppState((state) => state.branch);
  const register = useAppState((state) => state.register);
  const pendingCount = listLocalSyncQueue().filter((item) =>
    ["pending", "queued"].includes(item.status),
  ).length;

  return (
    <WorkspacePanel
      badge="Sprint 3"
      description="Basic cashier shift control with branch/register context and pending sync warning."
      title="Shift"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">
                {branch.name} / {register.name}
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                Current shift is {shiftStatus}
              </div>
            </div>
            <Badge tone={shiftStatus === "open" ? "success" : "warning"}>
              {shiftStatus}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Opening cash
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                defaultValue={100000}
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Closing cash
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                defaultValue={0}
                type="number"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              disabled={shiftStatus === "open"}
              onClick={() => setShiftStatus("open")}
              type="button"
            >
              Open Shift
            </Button>
            <Button
              disabled={shiftStatus === "closed"}
              onClick={() => setShiftStatus("closed")}
              type="button"
              variant="secondary"
            >
              Close Shift
            </Button>
          </div>
        </section>

        <aside className="rounded-md border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-950">
            Close readiness
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Pending sync</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Non-cash recorded</span>
              <span className="font-medium">Ready</span>
            </div>
          </div>
          {pendingCount > 0 ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Some transactions are still pending sync. You can close the shift,
              but review sync status before handoff.
            </div>
          ) : null}
        </aside>
      </div>
    </WorkspacePanel>
  );
}
