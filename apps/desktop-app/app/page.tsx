import { AppShell, PlaceholderPanel } from "@/components/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <PlaceholderPanel
        description="Role landing area for branch operations, HQ control, or executive analytics. This is ready to be replaced by Figma or Stitch exports."
        title="Role-Based Workspace"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {["Sales today", "Stock alerts", "Open shifts"].map(
            (label, index) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={label}
              >
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {[128, 7, 2][index]}
                </div>
              </div>
            ),
          )}
        </div>
      </PlaceholderPanel>
    </AppShell>
  );
}
