export type StockNotificationSeverity = "critical" | "warning";
export type StockNotificationSource = "local" | "central";
export type StockNotificationType = "out_of_stock" | "low_stock";

export type StockNotificationProduct = {
  id: string;
  sku: string;
  name: string;
  branchName: string;
  quantityOnHand: number;
  threshold: number;
  source: StockNotificationSource;
  updatedAt?: string;
};

export type StockNotification = {
  productId: string;
  sku: string;
  name: string;
  branchName: string;
  quantityOnHand: number;
  threshold: number;
  severity: StockNotificationSeverity;
  source: StockNotificationSource;
  type: StockNotificationType;
  updatedAt?: string;
};

export function buildStockNotifications(
  products: StockNotificationProduct[],
): StockNotification[] {
  return products
    .flatMap((product) => {
      if (product.quantityOnHand <= 0) {
        return [toNotification(product, "out_of_stock", "critical")];
      }

      if (product.threshold > 0 && product.quantityOnHand <= product.threshold) {
        return [toNotification(product, "low_stock", "warning")];
      }

      return [];
    })
    .sort(compareStockNotifications);
}

export function summarizeStockNotifications(
  notifications: StockNotification[],
) {
  return {
    total: notifications.length,
    outOfStock: notifications.filter((item) => item.type === "out_of_stock")
      .length,
    lowStock: notifications.filter((item) => item.type === "low_stock").length,
  };
}

export function getStockNotificationType(product: {
  stockOnHand: number;
  minimumQuantity: number;
}): StockNotificationType | null {
  if (product.stockOnHand <= 0) {
    return "out_of_stock";
  }

  if (product.minimumQuantity > 0 && product.stockOnHand <= product.minimumQuantity) {
    return "low_stock";
  }

  return null;
}

function toNotification(
  product: StockNotificationProduct,
  type: StockNotificationType,
  severity: StockNotificationSeverity,
): StockNotification {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    branchName: product.branchName,
    quantityOnHand: product.quantityOnHand,
    threshold: product.threshold,
    severity,
    source: product.source,
    type,
    updatedAt: product.updatedAt,
  };
}

function compareStockNotifications(
  first: StockNotification,
  second: StockNotification,
) {
  if (first.severity !== second.severity) {
    return first.severity === "critical" ? -1 : 1;
  }

  const firstRatio = getStockRatio(first);
  const secondRatio = getStockRatio(second);

  if (firstRatio !== secondRatio) {
    return firstRatio - secondRatio;
  }

  return first.name.localeCompare(second.name);
}

function getStockRatio(notification: StockNotification) {
  if (notification.threshold <= 0) {
    return notification.quantityOnHand <= 0 ? 0 : Number.POSITIVE_INFINITY;
  }

  return notification.quantityOnHand / notification.threshold;
}
