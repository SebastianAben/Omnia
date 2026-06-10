"use client";

import { useEffect, useState } from "react";
import { Badge, Button } from "@omnia/ui";

import { WorkspacePanel } from "@/components/app-shell";
import { InlineFeedback, UiStatePanel } from "@/components/ui-state";
import {
  listLocalSyncQueue,
  replayPendingSync,
  type LocalSyncQueueRecord,
} from "@/features/local-first/local-checkout-repository";
import { getSyncStatusAction } from "@/features/uat/operational-copy";
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
  const [queue, setQueue] = useState<LocalSyncQueueRecord[]>([]);
  const [replayMessage, setReplayMessage] = useState<string | null>(null);
  const [isReplaying, setReplaying] = useState(false);
  const token = useAppState((state) => state.token);
  const setPendingSyncCount = useAppState((state) => state.setPendingSyncCount);

  useEffect(() => {
    void refreshQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPendingSyncCount]);

  const refreshQueue = async () => {
    const nextQueue = await listLocalSyncQueue();
    const nextSummary = getLocalSyncSummary(nextQueue);
    setQueue(nextQueue);
    setSummary(nextSummary);
    setPendingSyncCount(
      nextSummary.reduce((total, item) => total + item.pending, 0),
    );
  };

  const handleReplay = async () => {
    setReplaying(true);
    setReplayMessage(null);

    try {
      const result = await replayPendingSync(token);
      setReplayMessage(
        `${result.attempted} attempted, ${result.synced} synced, ${result.failed} failed, ${result.conflict} conflict, ${result.deferred} deferred.`,
      );
      await refreshQueue();
    } catch (error) {
      setReplayMessage(
        error instanceof Error ? error.message : "Sync replay failed.",
      );
    } finally {
      setReplaying(false);
    }
  };

  return (
    <WorkspacePanel
      badge="Local queue"
      description="Branch-side sync monitor for pending checkout, shift, and inventory events."
      title="Sync Status"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Replay pending and failed local events when the central backend is
          reachable.
        </div>
        <Button
          className="h-9"
          disabled={isReplaying}
          onClick={handleReplay}
          type="button"
        >
          {isReplaying ? "Replaying..." : "Replay Sync"}
        </Button>
      </div>
      {replayMessage ? (
        <InlineFeedback className="mb-4">
          {replayMessage}
        </InlineFeedback>
      ) : null}

      <div className="grid gap-3">
        {summary.map((item) => {
          const action = getSyncStatusAction(
            item.failed > 0
              ? "failed"
              : item.pending > 0
                ? "pending"
                : "synced",
          );

          return (
            <div
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
              key={item.label}
            >
              <div>
                <div className="text-sm font-medium text-slate-950">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500">
                  {item.description}. {action.nextAction}
                </div>
              </div>
              <Badge tone={item.status}>{formatStatus(item)}</Badge>
            </div>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium">Next Retry</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {queue.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-slate-500"
                  colSpan={7}
                >
                  No queued local event. New checkout, shift, and inventory
                  events will appear here before replay.
                </td>
              </tr>
            ) : (
              queue.map((item) => {
                const action = getSyncStatusAction(item.status);

                return (
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
                  <td className="px-3 py-2 text-slate-600">
                    {item.nextRetryAt
                      ? new Date(item.nextRetryAt).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={action.tone}>{action.label}</Badge>
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-500">
                    {item.lastErrorMessage ??
                      item.lastErrorCode ??
                      action.nextAction}
                  </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {queue.some((item) => item.status === "failed" || item.status === "conflict") ? (
        <UiStatePanel className="mt-4" tone="warning">
          Failed or conflict events need review before UAT handoff. Keep checkout
          available, then replay once the cause is resolved.
        </UiStatePanel>
      ) : null}
    </WorkspacePanel>
  );
}
