export type PosProduct = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  categoryName: string;
  unit: string;
  price: number;
  stockOnHand: number;
  minimumQuantity: number;
};

export type CartLine = {
  product: PosProduct;
  quantity: number;
  discountTotal: number;
};

export type PaymentMethod = "cash" | "transfer" | "qris" | "debit";
export type PaymentStatus = "paid" | "pending";

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
};

export type CheckoutResult = {
  transactionId: string;
  transactionNo: string;
  eventId: string;
  total: number;
};
