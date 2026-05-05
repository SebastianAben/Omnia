"use client";

import { create } from "zustand";

export type OmniaRole = "cashier" | "supervisor" | "hq_admin" | "executive";

type AppState = {
  role: OmniaRole;
  branchName: string;
  registerName: string;
  userName: string;
  shiftStatus: "open" | "closed";
  isOnline: boolean;
  pendingSyncCount: number;
  setRole: (role: OmniaRole) => void;
};

export const roleLabels: Record<OmniaRole, string> = {
  cashier: "Cashier",
  supervisor: "Store Supervisor",
  hq_admin: "HQ Admin",
  executive: "Executive",
};

export const useAppState = create<AppState>((set) => ({
  role: "cashier",
  branchName: "Branch A",
  registerName: "Register 01",
  userName: "Demo User",
  shiftStatus: "open",
  isOnline: true,
  pendingSyncCount: 3,
  setRole: (role) => set({ role }),
}));
