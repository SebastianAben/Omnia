"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type OmniaRole = "cashier" | "supervisor" | "hq_admin" | "executive";
export type ShiftStatus = "open" | "closed";
export type SessionMode = "demo" | "password";

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
  sessionMode: SessionMode;
  token?: string;
  activeShiftId?: string;
  shiftStatus: ShiftStatus;
  isOnline: boolean;
  pendingSyncCount: number;
}

export interface AppActions {
  setRole: (role: OmniaRole) => void;
  setOnline: (isOnline: boolean) => void;
  setPendingSyncCount: (pendingSyncCount: number) => void;
  setShiftStatus: (shiftStatus: ShiftStatus) => void;
  setActiveShiftId: (activeShiftId?: string) => void;
  setToken: (token?: string) => void;
  setSession: (session: {
    token?: string;
    user: SessionUser;
    branch?: BranchContext;
    register?: RegisterContext;
    activeShiftId?: string;
    sessionMode?: SessionMode;
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

export const defaultBranch: BranchContext = {
  id: "br_demo",
  code: "BR-DEMO",
  name: "Branch A",
};

export const defaultUser: SessionUser = {
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
    sessionMode: "demo",
    token: undefined,
    activeShiftId: undefined,
    shiftStatus: "closed",
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
    setActiveShiftId: (activeShiftId) => set({ activeShiftId }),
    setToken: (token) => set({ token }),
    setSession: ({
      token,
      user,
      branch,
      register,
      activeShiftId,
      sessionMode = "password",
    }) =>
      set((state) => ({
        token,
        user,
        sessionMode,
        role: user.role,
        branch: branch ?? state.branch,
        register: register ?? state.register,
        activeShiftId,
        shiftStatus: activeShiftId ? "open" : "closed",
      })),
  })),
);
