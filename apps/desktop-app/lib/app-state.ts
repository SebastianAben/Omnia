"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type OmniaRole = "cashier" | "supervisor" | "hq_admin" | "executive";
export type ShiftStatus = "open" | "closed";

export type SessionUser = {
  id: string;
  fullName: string;
  username: string;
  role: OmniaRole;
  branchId?: string;
};

export type BranchContext = {
  id: string;
  code: string;
  name: string;
};

export type RegisterContext = {
  id: string;
  name: string;
};

export interface AppState {
  role: OmniaRole;
  branch: BranchContext;
  register: RegisterContext;
  user: SessionUser;
  token?: string;
  shiftStatus: ShiftStatus;
  isOnline: boolean;
  pendingSyncCount: number;
}

export interface AppActions {
  setRole: (role: OmniaRole) => void;
  setOnline: (isOnline: boolean) => void;
  setPendingSyncCount: (pendingSyncCount: number) => void;
  setShiftStatus: (shiftStatus: ShiftStatus) => void;
  setSession: (session: {
    token?: string;
    user: SessionUser;
    branch?: BranchContext;
  }) => void;
}

export type AppStore = AppState & AppActions;

export const roleLabels: Record<OmniaRole, string> = {
  cashier: "Cashier",
  supervisor: "Store Supervisor",
  hq_admin: "HQ Admin",
  executive: "Executive",
};

export const roleFromApi = (roleCode: string): OmniaRole => {
  const normalized = roleCode.toLowerCase();

  if (normalized.includes("supervisor")) {
    return "supervisor";
  }

  if (normalized.includes("hq") || normalized.includes("admin")) {
    return "hq_admin";
  }

  if (normalized.includes("executive") || normalized.includes("analyst")) {
    return "executive";
  }

  return "cashier";
};

const defaultBranch: BranchContext = {
  id: "br_demo",
  code: "BR-DEMO",
  name: "Branch A",
};

const defaultUser: SessionUser = {
  id: "usr_demo_cashier",
  fullName: "Demo Cashier",
  username: "demo.cashier",
  role: "cashier",
  branchId: defaultBranch.id,
};

export const useAppState = create<AppStore>()(
  subscribeWithSelector((set) => ({
    role: defaultUser.role,
    branch: defaultBranch,
    register: {
      id: "reg_demo_01",
      name: "Register 01",
    },
    user: defaultUser,
    token: undefined,
    shiftStatus: "open",
    isOnline: true,
    pendingSyncCount: 0,
    setRole: (role) =>
      set((state) => ({
        role,
        user: {
          ...state.user,
          role,
        },
      })),
    setOnline: (isOnline) => set({ isOnline }),
    setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
    setShiftStatus: (shiftStatus) => set({ shiftStatus }),
    setSession: ({ token, user, branch }) =>
      set((state) => ({
        token,
        user,
        role: user.role,
        branch: branch ?? state.branch,
      })),
  })),
);
