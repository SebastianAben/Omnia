"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { CartLine, PaymentStatus, PosProduct } from "./pos-types";

export interface CartState {
  lines: CartLine[];
  selectedPaymentMethod: "cash" | "transfer" | "qris" | "debit";
  paymentStatus: PaymentStatus;
  amountReceived: number;
}

export interface CartActions {
  addProduct: (product: PosProduct) => void;
  decrementProduct: (productId: string) => void;
  removeProduct: (productId: string) => void;
  setLineDiscount: (productId: string, discountTotal: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: CartState["selectedPaymentMethod"]) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setAmountReceived: (amount: number) => void;
}

export type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  subscribeWithSelector((set) => ({
    lines: [],
    selectedPaymentMethod: "cash",
    paymentStatus: "paid",
    amountReceived: 0,
    addProduct: (product) =>
      set((state) => {
        if (product.stockOnHand <= 0) {
          return state;
        }

        const existing = state.lines.find(
          (line) => line.product.id === product.id,
        );

        if (!existing) {
          return {
            lines: [...state.lines, { product, quantity: 1, discountTotal: 0 }],
          };
        }

        return {
          lines: state.lines.map((line) =>
            line.product.id === product.id
              ? {
                  ...line,
                  quantity: Math.min(line.quantity + 1, product.stockOnHand),
                }
              : line,
          ),
        };
      }),
    decrementProduct: (productId) =>
      set((state) => ({
        lines: state.lines
          .map((line) =>
            line.product.id === productId
              ? { ...line, quantity: line.quantity - 1 }
              : line,
          )
          .filter((line) => line.quantity > 0),
      })),
    removeProduct: (productId) =>
      set((state) => ({
        lines: state.lines.filter((line) => line.product.id !== productId),
      })),
    setLineDiscount: (productId, discountTotal) =>
      set((state) => ({
        lines: state.lines.map((line) => {
          if (line.product.id !== productId) {
            return line;
          }

          const lineSubtotal = line.product.price * line.quantity;
          return {
            ...line,
            discountTotal: Math.min(Math.max(discountTotal, 0), lineSubtotal),
          };
        }),
      })),
    clearCart: () => set({ lines: [] }),
    setPaymentMethod: (selectedPaymentMethod) => set({ selectedPaymentMethod }),
    setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
    setAmountReceived: (amountReceived) =>
      set({ amountReceived: Math.max(amountReceived, 0) }),
  })),
);
