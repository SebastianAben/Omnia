"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Badge, Button, cn } from "@omnia/ui";
import {
  BarChart3,
  Clock3,
  LayoutDashboard,
  MonitorCog,
  PackageSearch,
  PlugZap,
  ReceiptText,
  ScrollText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { roleLabels, type OmniaRole, useAppState } from "@/lib/app-state";
import { StatusBar } from "@/components/status-bar";

const navByRole: Record<
  OmniaRole,
  Array<{ href: string; label: string; icon: ComponentType<{ size?: number }> }>
> = {
  cashier: [
    { href: "/pos", label: "POS", icon: ReceiptText },
    { href: "/shift", label: "Shift", icon: Clock3 },
    { href: "/receipts", label: "Receipts", icon: ScrollText },
    { href: "/sync-status", label: "Sync", icon: RefreshCcw },
  ],
  supervisor: [
    { href: "/workspace", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "POS", icon: ReceiptText },
    { href: "/shift", label: "Shift", icon: Clock3 },
    { href: "/inventory", label: "Inventory", icon: PackageSearch },
    { href: "/receipts", label: "Receipts", icon: ScrollText },
    { href: "/sync-status", label: "Sync", icon: RefreshCcw },
    { href: "/audit", label: "Audit", icon: ShieldCheck },
  ],
  hq_admin: [
    { href: "/workspace", label: "Dashboard", icon: MonitorCog },
    { href: "/integrations/shopee", label: "Shopee", icon: PlugZap },
    { href: "/sync-status", label: "Sync", icon: RefreshCcw },
    { href: "/audit", label: "Audit", icon: ShieldCheck },
    { href: "/pos", label: "POS Preview", icon: ReceiptText },
  ],
  executive: [
    { href: "/workspace", label: "Dashboard", icon: BarChart3 },
    { href: "/sync-status", label: "Sync", icon: RefreshCcw },
    { href: "/audit", label: "Audit", icon: ShieldCheck },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useAppState();
  const navItems = navByRole[role];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-lg font-semibold tracking-normal text-slate-950">
            Omnia
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Branch operations workspace
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600",
                  active && "bg-slate-950 text-white",
                  !active && "hover:bg-slate-100 hover:text-slate-950",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
            Role
          </label>
          <div className="grid gap-2">
            {(Object.keys(roleLabels) as OmniaRole[]).map((item) => (
              <Button
                className="h-8 justify-start px-2 text-xs"
                key={item}
                onClick={() => setRole(item)}
                type="button"
                variant={role === item ? "primary" : "ghost"}
              >
                {roleLabels[item]}
              </Button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <StatusBar />
        <main className="min-h-0 flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}

export function WorkspacePanel({
  title,
  description,
  children,
  badge,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  badge?: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {badge ? <Badge>{badge}</Badge> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export const PlaceholderPanel = WorkspacePanel;
