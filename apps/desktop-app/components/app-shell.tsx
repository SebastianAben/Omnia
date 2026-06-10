"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import { Badge, Button, cn } from "@omnia/ui";
import {
  BarChart3,
  BrainCircuit,
  Clock3,
  LayoutDashboard,
  MonitorCog,
  PackageSearch,
  ReceiptText,
  ScrollText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { roleLabels, type OmniaRole, useAppState } from "@/lib/app-state";
import { StatusBar } from "@/components/status-bar";
import { logoutSession, switchDemoRole } from "@/features/auth/auth-service";

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
    { href: "/ai", label: "LLM Insights", icon: BrainCircuit },
    { href: "/sync-status", label: "Sync", icon: RefreshCcw },
    { href: "/audit", label: "Audit", icon: ShieldCheck },
    { href: "/pos", label: "POS Preview", icon: ReceiptText },
  ],
  executive: [
    { href: "/workspace", label: "Dashboard", icon: BarChart3 },
    { href: "/ai", label: "LLM Insights", icon: BrainCircuit },
    { href: "/sync-status", label: "Sync", icon: RefreshCcw },
    { href: "/audit", label: "Audit", icon: ShieldCheck },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, sessionMode, setSession, token } = useAppState();
  const [isSigningOut, setSigningOut] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<OmniaRole | null>(null);
  const [roleSwitchError, setRoleSwitchError] = useState<string | null>(null);
  const navItems = navByRole[role];
  const isDemoSession = sessionMode === "demo" && Boolean(token);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logoutSession();
    } catch {
      // Local credentials are cleared before remote revocation is attempted.
    } finally {
      router.replace("/login");
      setSigningOut(false);
    }
  };

  const switchDemoSessionRole = async (nextRole: OmniaRole) => {
    if (nextRole === role || switchingRole) {
      return;
    }

    setSwitchingRole(nextRole);
    setRoleSwitchError(null);

    try {
      const session = await switchDemoRole(nextRole);
      setSession(session);

      const nextNavItems = navByRole[session.user.role];
      if (!nextNavItems.some((item) => item.href === pathname)) {
        router.replace(nextNavItems[0]?.href ?? "/pos");
      }
    } catch {
      setRoleSwitchError(
        "Tidak bisa mengganti role demo. Cek koneksi backend.",
      );
      router.replace("/login");
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-surface text-ink">
      <div className="flex h-full min-h-0">
        <aside className="hidden h-full w-[5.25rem] shrink-0 overflow-hidden border-r border-line/80 bg-white/82 px-3 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.85)] backdrop-blur-xl md:flex md:flex-col xl:w-72 xl:px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-950 p-3 text-white shadow-panel">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-sm font-black text-slate-950">
              O
            </div>
            <div className="hidden min-w-0 xl:block">
              <div className="text-base font-semibold tracking-[-0.03em]">
                Omnia
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-300">
                Operasional cabang
              </div>
            </div>
          </div>

          <nav className="mt-5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  className={cn(
                    "group relative flex h-11 items-center justify-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-950 active:translate-y-px xl:justify-start",
                    active &&
                      "bg-slate-950 text-white shadow-[0_12px_28px_-20px_rgba(15,23,42,0.9)] hover:bg-slate-900 hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span className="hidden truncate xl:inline">
                    {item.label}
                  </span>
                  {!active ? null : (
                    <span className="absolute -right-1 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-full bg-accent xl:block" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 rounded-2xl border border-line/70 bg-white/74 p-2 shadow-lift xl:p-3">
            <label className="mb-2 hidden text-xs font-semibold text-slate-500 xl:block">
              Role
            </label>
            <div className="grid gap-1.5">
              {isDemoSession ? (
                (Object.keys(roleLabels) as OmniaRole[]).map((item) => (
                  <Button
                    className="h-8 justify-center px-2 text-xs xl:justify-start"
                    disabled={Boolean(switchingRole)}
                    key={item}
                    onClick={() => void switchDemoSessionRole(item)}
                    type="button"
                    variant={role === item ? "primary" : "ghost"}
                  >
                    <span className="xl:hidden">
                      {switchingRole === item
                        ? "..."
                        : roleLabels[item].slice(0, 2)}
                    </span>
                    <span className="hidden xl:inline">
                      {switchingRole === item
                        ? "Switching..."
                        : roleLabels[item]}
                    </span>
                  </Button>
                ))
              ) : (
                <div className="flex justify-center xl:justify-start">
                  <Badge>{roleLabels[role]}</Badge>
                </div>
              )}
              {token ? (
                <Button
                  className="h-8 justify-center px-2 text-xs xl:justify-start"
                  disabled={isSigningOut}
                  onClick={() => void signOut()}
                  type="button"
                  variant="secondary"
                >
                  <span className="xl:hidden">SO</span>
                  <span className="hidden xl:inline">
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </span>
                </Button>
              ) : null}
            </div>
            {roleSwitchError ? (
              <p className="mt-2 hidden text-xs leading-5 text-red-600 xl:block">
                {roleSwitchError}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <StatusBar />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px]">{children}</div>
          </main>
        </div>
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
    <section className="rounded-3xl border border-line/80 bg-white/88 p-5 shadow-panel shadow-slate-200/70 backdrop-blur-xl md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-slate-600">
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
