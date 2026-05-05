"use client";

import { useEffect, useState } from "react";
import { Badge } from "@omnia/ui";

import { WorkspacePanel } from "@/components/app-shell";
import { listLocalSyncQueue } from "@/features/local-first/local-checkout-repository";
import { useAppState } from "@/lib/app-state";
import { getLocalSyncSummary, type SyncQueueSummary } from "./sync-summary";

const formatStatus = (item: SyncQueueSummary) => {
  if (item.failed > 0) {
    return `${item.failed} failed`;
  }

  if (item.pending > 0) {
    return `${item.pending} pending`;
  }

  return "Synced";
};

export function SyncStatusPanel() {
  const [summary, setSummary] = useState<SyncQueueSummary[]>([]);
  const [queue, setQueue] = useState<ReturnType<typeof listLocalSyncQueue>>([]);
  const setPendingSyncCount = useAppState((state) => state.setPendingSyncCount);

  useEffect(() => {
    const nextSummary = getLocalSyncSummary();
    const nextQueue = listLocalSyncQueue();
    setSummary(nextSummary);
    setQueue(nextQueue);
    setPendingSyncCount(
      nextSummary.reduce((total, item) => total + item.pending, 0),
    );
  }, [setPendingSyncCount]);

  return (
    <WorkspacePanel
      badge="Local queue"
      description="Branch-side sync monitor for pending checkout bundles and local-first replay readiness."
      title="Sync Status"
    >
      <div className="grid gap-3">
        {summary.map((item) => (
          <div
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
            key={item.label}
          >
            <div>
              <div className="text-sm font-medium text-slate-950">
                {item.label}
              </div>
              <div className="text-xs text-slate-500">{item.description}</div>
            </div>
            <Badge tone={item.status}>{formatStatus(item)}</Badge>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {queue.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-slate-500"
                  colSpan={5}
                >
                  No queued local event
                </td>
              </tr>
            ) : (
              queue.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-medium text-slate-950">
                    {item.eventType}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{item.entityId}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {new Date(item.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {item.attemptCount}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      tone={
                        item.status === "failed" || item.status === "conflict"
                          ? "danger"
                          : item.status === "synced"
                            ? "success"
                            : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </WorkspacePanel>
  );
}
