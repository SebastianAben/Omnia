"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Badge, Button, cn } from "@omnia/ui";
import {
  AlertTriangle,
  Boxes,
  ExternalLink,
  PlugZap,
  RefreshCcw,
} from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import { useAppState } from "@/lib/app-state";
import {
  useCreateShopeeMapping,
  useCreateShopeeStore,
  useProductOptions,
  useRetryShopeeJob,
  useShopeeHealth,
  useShopeeOrder,
  useShopeeOrders,
  useShopeeProductMappings,
  useShopeeStores,
  type ShopeeIntegrationJob,
  type ShopeeOrder,
  type ShopeeProductMapping,
} from "./shopee-service";

const inputClass =
  "h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const emptyStores: Array<{
  id: string;
  store_name: string;
  external_store_id: string;
}> = [];
const emptyMappings: ShopeeProductMapping[] = [];
const emptyOrders: ShopeeOrder[] = [];
const emptyProducts: Array<{ id: string; sku: string; name: string }> = [];
const emptyJobs: ShopeeIntegrationJob[] = [];

export function ShopeeWorkspace() {
  const token = useAppState((state) => state.token);
  const role = useAppState((state) => state.role);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const storesQuery = useShopeeStores(token);
  const mappingsQuery = useShopeeProductMappings(token);
  const ordersQuery = useShopeeOrders(token);
  const healthQuery = useShopeeHealth(token);
  const productsQuery = useProductOptions(token);
  const orderQuery = useShopeeOrder(selectedOrderId, token);
  const retryJob = useRetryShopeeJob(token);

  const selectedOrder =
    orderQuery.data ??
    ordersQuery.data?.find((order) => order.id === selectedOrderId) ??
    null;
  const stores = storesQuery.data ?? emptyStores;
  const mappings = mappingsQuery.data ?? emptyMappings;
  const orders = ordersQuery.data ?? emptyOrders;
  const products = productsQuery.data ?? emptyProducts;
  const health = healthQuery.data;
  const failedJobs = health?.failed_jobs ?? emptyJobs;

  const totalSales = useMemo(
    () =>
      orders.reduce(
        (total, order) => total + Number(order.total_amount || 0),
        0,
      ),
    [orders],
  );

  if (role !== "hq_admin") {
    return (
      <WorkspacePanel
        badge="Restricted"
        description="Shopee marketplace setup is only available to HQ Admin."
        title="Shopee Integration"
      >
        <StatePanel
          label="Your current role cannot manage Shopee integration."
          tone="warning"
        />
      </WorkspacePanel>
    );
  }

  if (!token) {
    return (
      <WorkspacePanel
        badge="Sign in required"
        description="Shopee marketplace setup requires an authenticated HQ Admin session."
        title="Shopee Integration"
      >
        <StatePanel label="Login required to manage Shopee integration." tone="warning" />
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      badge="HQ Admin"
      description="Operational console for mock-first Shopee store connection, SKU mapping, order import review, health checks, and retry handling."
      title="Shopee Integration"
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Stores" value={String(stores.length)} />
          <Metric label="Mappings" value={String(mappings.length)} />
          <Metric label="Orders" value={String(orders.length)} />
          <Metric label="Imported GMV" value={formatCurrency(totalSales)} />
        </section>

        <IntegrationHealth
          error={healthQuery.error}
          failedJobs={failedJobs}
          isLoading={healthQuery.isLoading}
          onRetry={(jobId) => retryJob.mutate(jobId)}
          retryingJobId={retryJob.variables}
          status={health?.status}
          summary={[
            ["Connected stores", health?.connected_store_count],
            ["Active mappings", health?.active_mapping_count],
            ["Imported orders", health?.imported_order_count],
            ["Failed jobs", health?.failed_job_count],
          ]}
          lastCheckedAt={health?.last_checked_at}
        />

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="grid gap-5">
            <ConnectStorePanel />
            <MappingForm
              products={products}
              productLoadFailed={productsQuery.isError}
              stores={stores}
            />
          </section>

          <section className="grid gap-5">
            <StoreList error={storesQuery.error} stores={stores} />
            <MappingList error={mappingsQuery.error} mappings={mappings} />
          </section>
        </div>

        <OrdersWorkspace
          error={ordersQuery.error}
          isDetailLoading={orderQuery.isFetching}
          onSelectOrder={setSelectedOrderId}
          orders={orders}
          selectedOrder={selectedOrder}
          selectedOrderId={selectedOrderId}
        />
      </div>
    </WorkspacePanel>
  );
}

function ConnectStorePanel() {
  const token = useAppState((state) => state.token);
  const createStore = useCreateShopeeStore(token);
  const [storeName, setStoreName] = useState("Omnia Shopee Mock Store");
  const [externalStoreId, setExternalStoreId] = useState("shp_mock_store_001");
  const [credentialReference, setCredentialReference] = useState("mock");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createStore.mutate({
      store_name: storeName.trim(),
      external_store_id: externalStoreId.trim(),
      credential_reference: credentialReference.trim() || undefined,
    });
  }

  return (
    <form
      className="rounded-md border border-slate-200 bg-white p-4"
      onSubmit={handleSubmit}
    >
      <PanelHeader
        icon={<PlugZap size={16} />}
        subtitle="Register a mock Shopee store context."
        title="Connect Store"
      />
      <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
        Store name
        <input
          className={inputClass}
          onChange={(event) => setStoreName(event.target.value)}
          required
          value={storeName}
        />
      </label>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        External store ID
        <input
          className={inputClass}
          onChange={(event) => setExternalStoreId(event.target.value)}
          required
          value={externalStoreId}
        />
      </label>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        Credential reference
        <input
          className={inputClass}
          onChange={(event) => setCredentialReference(event.target.value)}
          value={credentialReference}
        />
      </label>
      <Button
        className="mt-4 w-full"
        disabled={createStore.isPending}
        type="submit"
      >
        {createStore.isPending ? "Connecting..." : "Connect Mock Store"}
      </Button>
      <MutationMessage
        error={createStore.error}
        success={createStore.isSuccess ? "Store connection saved." : null}
      />
    </form>
  );
}

function MappingForm({
  productLoadFailed,
  products,
  stores,
}: {
  productLoadFailed: boolean;
  products: Array<{ id: string; sku: string; name: string }>;
  stores: Array<{ id: string; store_name: string }>;
}) {
  const token = useAppState((state) => state.token);
  const createMapping = useCreateShopeeMapping(token);
  const [storeId, setStoreId] = useState("");
  const [productId, setProductId] = useState("");
  const [externalProductId, setExternalProductId] = useState("shp_prod_001");
  const [externalSku, setExternalSku] = useState("SHP-SKU-001");

  const activeStoreId = storeId || stores[0]?.id || "";
  const activeProductId = productId || products[0]?.id || "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createMapping.mutate({
      channel_store_id: activeStoreId,
      product_id: activeProductId,
      external_product_id: externalProductId.trim(),
      external_sku: externalSku.trim(),
    });
  }

  return (
    <form
      className="rounded-md border border-slate-200 bg-white p-4"
      onSubmit={handleSubmit}
    >
      <PanelHeader
        icon={<Boxes size={16} />}
        subtitle="Map Shopee SKU to an internal product."
        title="Product Mapping"
      />
      <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
        Store
        <select
          className={inputClass}
          disabled={stores.length === 0}
          onChange={(event) => setStoreId(event.target.value)}
          value={activeStoreId}
        >
          {stores.length === 0 ? (
            <option value="">No store connected</option>
          ) : (
            stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.store_name}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        Internal product
        <select
          className={inputClass}
          disabled={products.length === 0}
          onChange={(event) => setProductId(event.target.value)}
          value={activeProductId}
        >
          {products.length === 0 ? (
            <option value="">
              {productLoadFailed ? "Products unavailable" : "No product found"}
            </option>
          ) : (
            products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} / {product.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        Shopee product ID
        <input
          className={inputClass}
          onChange={(event) => setExternalProductId(event.target.value)}
          required
          value={externalProductId}
        />
      </label>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        Shopee SKU
        <input
          className={inputClass}
          onChange={(event) => setExternalSku(event.target.value)}
          required
          value={externalSku}
        />
      </label>
      <Button
        className="mt-4 w-full"
        disabled={
          createMapping.isPending ||
          !activeStoreId ||
          !activeProductId ||
          !externalProductId.trim() ||
          !externalSku.trim()
        }
        type="submit"
      >
        {createMapping.isPending ? "Saving..." : "Save Mapping"}
      </Button>
      <MutationMessage
        error={createMapping.error}
        success={createMapping.isSuccess ? "Product mapping saved." : null}
      />
    </form>
  );
}

function StoreList({
  error,
  stores,
}: {
  error: unknown;
  stores: Array<{
    id: string;
    store_name: string;
    external_store_id: string;
    status?: string | null;
    last_sync_at?: string | null;
  }>;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <TableHeader title="Connected Stores" />
      {error ? (
        <StatePanel label="Shopee stores API is unavailable." tone="danger" />
      ) : stores.length === 0 ? (
        <StatePanel label="No Shopee store connected yet." />
      ) : (
        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Store</th>
                <th className="px-3 py-2 font-medium">External ID</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Last sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="px-3 py-2 font-medium text-slate-950">
                    {store.store_name}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {store.external_store_id}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={store.status ?? "connected"} />
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {formatDateTime(store.last_sync_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MappingList({
  error,
  mappings,
}: {
  error: unknown;
  mappings: ShopeeProductMapping[];
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <TableHeader title="Product Mappings" />
      {error ? (
        <StatePanel
          label="Product mapping API is unavailable or access is denied."
          tone="danger"
        />
      ) : mappings.length === 0 ? (
        <StatePanel label="No Shopee SKU mapping yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Shopee SKU</th>
                <th className="px-3 py-2 font-medium">Shopee Product</th>
                <th className="px-3 py-2 font-medium">Internal Product</th>
                <th className="px-3 py-2 font-medium">Mapping</th>
                <th className="px-3 py-2 font-medium">Last sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-3 py-2 font-medium text-slate-950">
                    {mapping.external_sku}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {mapping.external_product_id}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {mapping.product
                      ? `${mapping.product.sku} / ${mapping.product.name}`
                      : mapping.product_id}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={mapping.mapping_status ?? "active"} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      status={mapping.last_sync_status ?? "pending"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OrdersWorkspace({
  error,
  isDetailLoading,
  onSelectOrder,
  orders,
  selectedOrder,
  selectedOrderId,
}: {
  error: unknown;
  isDetailLoading: boolean;
  onSelectOrder: (orderId: string) => void;
  orders: ShopeeOrder[];
  selectedOrder: ShopeeOrder | null;
  selectedOrderId: string | null;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-md border border-slate-200 bg-white">
        <TableHeader title="Imported Orders" />
        {error ? (
          <StatePanel label="Shopee orders API is unavailable." tone="danger" />
        ) : orders.length === 0 ? (
          <StatePanel label="No imported Shopee orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Store</th>
                  <th className="px-3 py-2 font-medium">Order status</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Imported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr
                    className={cn(
                      "cursor-pointer hover:bg-slate-50",
                      selectedOrderId === order.id && "bg-slate-50",
                    )}
                    key={order.id}
                    onClick={() => onSelectOrder(order.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-950">
                        {order.external_order_id}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customer_name ?? "Customer not provided"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {order.store?.store_name ?? order.channel_store_id ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatCurrency(Number(order.total_amount || 0))}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatDateTime(order.imported_at ?? order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="rounded-md border border-slate-200 bg-white p-4">
        <PanelHeader
          icon={<ExternalLink size={16} />}
          subtitle="Selected imported order summary."
          title="Order Detail"
        />
        {isDetailLoading ? (
          <StatePanel label="Loading order detail..." />
        ) : selectedOrder ? (
          <OrderSummary order={selectedOrder} />
        ) : (
          <StatePanel label="Select an order to inspect detail." />
        )}
      </aside>
    </section>
  );
}

function OrderSummary({ order }: { order: ShopeeOrder }) {
  const items = order.items ?? [];

  return (
    <div className="mt-4 grid gap-4">
      <div>
        <div className="text-xs uppercase text-slate-500">External order</div>
        <div className="mt-1 font-medium text-slate-950">
          {order.external_order_id}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Detail label="Order status" value={order.order_status} />
        <Detail label="Payment" value={order.payment_status} />
        <Detail
          label="Total"
          value={formatCurrency(Number(order.total_amount || 0))}
        />
        <Detail
          label="Imported"
          value={formatDateTime(order.imported_at ?? order.created_at)}
        />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-slate-950">Items</div>
        {items.length === 0 ? (
          <StatePanel label="No item detail returned by backend." />
        ) : (
          <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
            {items.map((item, index) => (
              <div
                className="p-3"
                key={item.id ?? `${item.external_sku}-${index}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-950">
                      {item.product_name ?? item.external_sku}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.external_sku}
                    </div>
                  </div>
                  <StatusBadge status={item.mapping_status ?? "mapped"} />
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {item.quantity} x{" "}
                  {formatCurrency(Number(item.unit_price || 0))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IntegrationHealth({
  error,
  failedJobs,
  isLoading,
  lastCheckedAt,
  onRetry,
  retryingJobId,
  status,
  summary,
}: {
  error: unknown;
  failedJobs: ShopeeIntegrationJob[];
  isLoading: boolean;
  lastCheckedAt?: string | null;
  onRetry: (jobId: string) => void;
  retryingJobId?: string;
  status?: string;
  summary: Array<[string, number | undefined]>;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHeader
          icon={<AlertTriangle size={16} />}
          subtitle={
            error
              ? "Monitoring endpoint could not be reached."
              : `Last checked ${formatDateTime(lastCheckedAt)}`
          }
          title="Integration Health"
        />
        <StatusBadge status={isLoading ? "checking" : (status ?? "unknown")} />
      </div>

      {error ? (
        <StatePanel
          label="Shopee monitoring is unavailable. Forms and order lists remain isolated from POS."
          tone="danger"
        />
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {summary.map(([label, value]) => (
            <Metric key={label} label={label} value={String(value ?? 0)} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 text-sm font-medium text-slate-950">
          Failed jobs
        </div>
        {failedJobs.length === 0 ? (
          <StatePanel label="No failed Shopee job reported." />
        ) : (
          <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
            {failedJobs.map((job) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 p-3"
                key={job.id}
              >
                <div>
                  <div className="font-medium text-slate-950">
                    {job.job_type}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Attempt {job.attempt_count ?? 0} /{" "}
                    {job.last_error ?? "No error detail"}
                  </div>
                </div>
                <Button
                  className="h-8 px-3"
                  disabled={retryingJobId === job.id}
                  onClick={() => onRetry(job.id)}
                  type="button"
                  variant="secondary"
                >
                  <RefreshCcw size={14} />
                  {retryingJobId === job.id ? "Retrying" : "Retry"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-950">{value}</div>
    </div>
  );
}

function PanelHeader({
  icon,
  subtitle,
  title,
}: {
  icon: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-700">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-950">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

function TableHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
    </div>
  );
}

function StatePanel({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-500",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={cn("m-4 rounded-md border px-3 py-3 text-sm", tones[tone])}>
      {label}
    </div>
  );
}

function MutationMessage({
  error,
  success,
}: {
  error: unknown;
  success: string | null;
}) {
  if (error) {
    return (
      <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error instanceof Error ? error.message : "Request failed."}
      </div>
    );
  }

  if (!success) {
    return null;
  }

  return (
    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {success}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("success") ||
    normalized.includes("active") ||
    normalized.includes("connected") ||
    normalized.includes("paid") ||
    normalized.includes("mapped") ||
    normalized.includes("healthy")
      ? "success"
      : normalized.includes("failed") ||
          normalized.includes("error") ||
          normalized.includes("missing") ||
          normalized.includes("unhealthy")
        ? "danger"
        : normalized.includes("pending") ||
            normalized.includes("checking") ||
            normalized.includes("retry")
          ? "warning"
          : "neutral";

  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("id-ID");
}
