"use client";

import { Badge } from "@omnia/ui";
import { ShieldCheck } from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import { useAuditLogs } from "@/features/dashboard/dashboard-service";
import { useAppState } from "@/lib/app-state";

export function AuditWorkspace() {
  const token = useAppState((state) => state.token);
  const branch = useAppState((state) => state.branch);
  const role = useAppState((state) => state.role);
  const branchId = role === "supervisor" ? branch.id : undefined;
  const audit = useAuditLogs(branchId, token);

  return (
    <WorkspacePanel
      badge="Audit"
      description="Trace login, transaction, stock, price, and sync actions from the central audit log."
      title="Audit Logs"
    >
      {!token ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Login required to inspect audit logs.
        </div>
      ) : audit.isLoading ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Loading audit logs...
        </div>
      ) : audit.isError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Audit API is unavailable or access is denied.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {audit.data?.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={auditTone(log.action)}>
                      <ShieldCheck size={12} />
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {log.entity_type}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {log.user?.full_name ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {log.branch?.code ?? "-"}
                  </td>
                  <td className="max-w-sm truncate px-3 py-2 text-slate-600">
                    {log.note ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WorkspacePanel>
  );
}

function auditTone(action: string): "neutral" | "success" | "warning" | "danger" {
  if (action.includes("conflict") || action.includes("failed")) {
    return "danger";
  }
  if (action.includes("sync")) {
    return "success";
  }
  if (action.includes("price") || action.includes("stock")) {
    return "warning";
  }
  return "neutral";
}

