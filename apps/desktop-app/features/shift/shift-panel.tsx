"use client";

import { useEffect, useState } from "react";
import { Button, Badge } from "@omnia/ui";

import { WorkspacePanel } from "@/components/app-shell";
import { useAppState } from "@/lib/app-state";
import {
  getLocalActiveShift,
  isLocalStoreBridgeAvailable,
  listLocalSyncQueue,
  saveShiftEvent,
} from "@/features/local-first/local-checkout-repository";

export function ShiftPanel() {
  const shiftStatus = useAppState((state) => state.shiftStatus);
  const setShiftStatus = useAppState((state) => state.setShiftStatus);
  const activeShiftId = useAppState((state) => state.activeShiftId);
  const setActiveShiftId = useAppState((state) => state.setActiveShiftId);
  const branch = useAppState((state) => state.branch);
  const register = useAppState((state) => state.register);
  const user = useAppState((state) => state.user);
  const [openingCashAmount, setOpeningCashAmount] = useState(100000);
  const [closingCashAmount, setClosingCashAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [localStoreReady, setLocalStoreReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasBridge = isLocalStoreBridgeAvailable();
    setLocalStoreReady(hasBridge);

    if (hasBridge) {
      void Promise.all([
        refreshPendingCount(),
        getLocalActiveShift(branch.id, register.id).then((shift) => {
          setActiveShiftId(shift?.id);
          setShiftStatus(shift ? "open" : "closed");
          if (shift) {
            setOpeningCashAmount(shift.openingCashAmount);
          }
        }),
      ]).catch((caught) => {
        setError(toShiftErrorMessage(caught));
      });
    }
  }, [
    branch.id,
    register.id,
    setActiveShiftId,
    setShiftStatus,
  ]);

  const refreshPendingCount = async () => {
    try {
      const queue = await listLocalSyncQueue();
      setPendingCount(
        queue.filter((item) => ["pending", "queued"].includes(item.status))
          .length,
      );
    } catch {
      setLocalStoreReady(false);
    }
  };

  const handleOpenShift = async () => {
    setError(null);
    if (!Number.isFinite(openingCashAmount) || openingCashAmount < 0) {
      setError("Opening cash must be a non-negative number.");
      return;
    }

    try {
      const result = await saveShiftEvent({
        branch,
        register,
        user,
        action: "open",
        openingCashAmount,
      });
      setActiveShiftId(result.shiftId);
      setShiftStatus("open");
      await refreshPendingCount();
    } catch (caught) {
      setError(toShiftErrorMessage(caught));
    }
  };

  const handleCloseShift = async () => {
    if (!activeShiftId) {
      return;
    }

    setError(null);
    if (!Number.isFinite(closingCashAmount) || closingCashAmount < 0) {
      setError("Closing cash must be a non-negative number.");
      return;
    }

    try {
      await saveShiftEvent({
        branch,
        register,
        user,
        action: "close",
        shiftId: activeShiftId,
        closingCashAmount,
      });
      setActiveShiftId(undefined);
      setShiftStatus("closed");
      await refreshPendingCount();
    } catch (caught) {
      setError(toShiftErrorMessage(caught));
    }
  };

  return (
    <WorkspacePanel
      badge="Operasional"
      description="Kontrol buka dan tutup shift kasir sesuai cabang, register, serta status sinkronisasi lokal."
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
                onChange={(event) =>
                  setOpeningCashAmount(Number(event.target.value || 0))
                }
                type="number"
                value={openingCashAmount}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Closing cash
              <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                onChange={(event) =>
                  setClosingCashAmount(Number(event.target.value || 0))
                }
                type="number"
                value={closingCashAmount}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              disabled={shiftStatus === "open" || !localStoreReady}
              onClick={handleOpenShift}
              type="button"
            >
              Open Shift
            </Button>
            <Button
              disabled={
                shiftStatus === "closed" || !activeShiftId || !localStoreReady
              }
              onClick={handleCloseShift}
              type="button"
              variant="secondary"
            >
              Close Shift
            </Button>
          </div>

          {!localStoreReady ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Local SQLite store belum tersedia di browser biasa. Buka Omnia
              lewat Electron desktop untuk open/close shift.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
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
          {shiftStatus === "open" && !activeShiftId ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              No active shift ID is recorded. Open a new shift before checkout
              or close operations.
            </div>
          ) : null}
        </aside>
      </div>
    </WorkspacePanel>
  );
}

function toShiftErrorMessage(caught: unknown) {
  if (caught instanceof Error) {
    if (caught.message.includes("local store bridge")) {
      return "Local SQLite store belum tersedia. Jalankan app lewat Electron desktop, bukan browser biasa.";
    }

    return caught.message;
  }

  return "Shift gagal disimpan ke local store.";
}
