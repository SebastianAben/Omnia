import { Button } from "@omnia/ui";
import { AppShell, PlaceholderPanel } from "@/components/app-shell";

export default function PosPage() {
  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <PlaceholderPanel
          description="Minimal checkout workspace placeholder for scanner input, product search, and cart building."
          title="POS Checkout"
        >
          <div className="grid gap-3">
            <input
              className="h-12 rounded-md border border-slate-300 px-4 text-base outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Scan barcode or search product"
            />
            <div className="grid gap-2">
              {[
                "SKU-001 Coffee Beans",
                "SKU-014 Paper Bag",
                "SKU-102 Oat Milk",
              ].map((item) => (
                <div
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                  key={item}
                >
                  <span>{item}</span>
                  <Button
                    className="h-8 px-3"
                    type="button"
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </PlaceholderPanel>

        <aside className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Cart Summary
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Items</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">Rp 128.000</span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>Rp 128.000</span>
              </div>
            </div>
          </div>
          <Button className="mt-5 w-full" type="button">
            Payment
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
