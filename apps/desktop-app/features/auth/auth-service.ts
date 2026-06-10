import {
  apiFetch,
  ApiClientError,
  setAccessTokenRefresher,
} from "@/lib/api-client";
import {
  roleFromApi,
  useAppState,
  type BranchContext,
  type OmniaRole,
  type RegisterContext,
  type SessionMode,
  type SessionUser,
} from "@/lib/app-state";
import { getLocalActiveShift } from "@/features/local-first/local-checkout-repository";

type LoginResponse = {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    full_name: string;
    username: string;
    role_code: string;
    branch_id?: string;
  };
  branches: Array<{
    id: string;
    code: string;
    name: string;
  }>;
};

export type LoginResult = {
  token: string;
  user: SessionUser;
  branch?: BranchContext;
  register?: RegisterContext;
  activeShiftId?: string;
  sessionMode: SessionMode;
};

const sessionTokenKey = "omnia.auth.token";
const refreshTokenKey = "omnia.auth.refresh-token";
type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthSessionBridge = {
  read: () => Promise<TokenPair | null>;
  write: (tokenPair: TokenPair) => Promise<boolean>;
  clear: () => Promise<void>;
};

let memoryTokenPair: TokenPair | undefined;
let refreshPromise: Promise<string | undefined> | undefined;

const demoPassword = "password123";
const demoRoleCredentials: Record<OmniaRole, { username: string }> = {
  cashier: { username: "demo.cashier" },
  supervisor: { username: "demo.supervisor" },
  hq_admin: { username: "demo.admin" },
  executive: { username: "demo.analyst" },
};

const mapSession = (
  data: LoginResponse,
  register?: RegisterContext,
  activeShiftId?: string,
  sessionMode: SessionMode = "password",
): LoginResult => ({
  token: data.token,
  user: {
    id: data.user.id,
    fullName: data.user.full_name,
    username: data.user.username,
    role: roleFromApi(data.user.role_code),
    branchId: data.user.branch_id,
  },
  branch: data.branches[0]
    ? {
        id: data.branches[0].id,
        code: data.branches[0].code,
        name: data.branches[0].name,
      }
    : undefined,
  register,
  activeShiftId,
  sessionMode,
});

type ApiRegister = {
  id: string;
  branch_id: string;
  name: string;
  device_identifier?: string | null;
};

async function saveTokenPair(
  data: Pick<LoginResponse, "token" | "refresh_token">,
) {
  const tokenPair = {
    accessToken: data.token,
    refreshToken: data.refresh_token,
  };
  memoryTokenPair = tokenPair;

  const secureStore = getAuthSessionBridge();
  if (secureStore) {
    clearBrowserTokenPair();
    const persisted = await secureStore.write(tokenPair);
    if (!persisted) {
      console.warn(
        "Secure session persistence is unavailable; tokens remain in memory.",
      );
    }
    return;
  }
}

async function readTokenPair(): Promise<TokenPair | undefined> {
  if (memoryTokenPair) {
    return memoryTokenPair;
  }

  const secureStore = getAuthSessionBridge();
  if (secureStore) {
    const stored = await secureStore.read();
    if (stored) {
      memoryTokenPair = stored;
      clearBrowserTokenPair();
      return stored;
    }

    const legacyTokenPair = readBrowserTokenPair();
    if (legacyTokenPair) {
      memoryTokenPair = legacyTokenPair;
      clearBrowserTokenPair();
      const migrated = await secureStore.write(legacyTokenPair);
      if (!migrated) {
        console.warn(
          "Secure session migration is unavailable; tokens remain in memory.",
        );
      }
      return legacyTokenPair;
    }

    return undefined;
  }

  memoryTokenPair = readBrowserTokenPair();
  clearBrowserTokenPair();
  return memoryTokenPair;
}

async function clearStoredSession() {
  memoryTokenPair = undefined;
  clearBrowserTokenPair();
  await getAuthSessionBridge()?.clear();
}

function readBrowserTokenPair(): TokenPair | undefined {
  const accessToken = window.localStorage.getItem(sessionTokenKey);
  const refreshToken = window.localStorage.getItem(refreshTokenKey);

  return accessToken && refreshToken
    ? { accessToken, refreshToken }
    : undefined;
}

function clearBrowserTokenPair() {
  window.localStorage.removeItem(sessionTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
}

function getAuthSessionBridge() {
  const desktopWindow = window as typeof window & {
    omniaDesktop?: { authSession?: AuthSessionBridge };
  };

  return desktopWindow.omniaDesktop?.authSession;
}

export async function loginWithPassword(input: {
  username: string;
  password: string;
  deviceId: string;
}): Promise<LoginResult> {
  return loginWithCredentials({
    ...input,
    sessionMode: "password",
  });
}

export async function loginWithDemoRole(
  role: OmniaRole = "cashier",
  deviceId = "omnia-desktop-register-01",
): Promise<LoginResult> {
  const credentials = demoRoleCredentials[role];

  return loginWithCredentials({
    username: credentials.username,
    password: demoPassword,
    deviceId,
    sessionMode: "demo",
  });
}

export async function switchDemoRole(role: OmniaRole): Promise<LoginResult> {
  await logoutSession();
  return loginWithDemoRole(role);
}

async function loginWithCredentials(input: {
  username: string;
  password: string;
  deviceId: string;
  sessionMode: SessionMode;
}): Promise<LoginResult> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      device_id: input.deviceId,
    }),
  });

  const register = await resolveRegister(
    data.user.branch_id,
    data.token,
    input.deviceId,
  );
  const activeShiftId = await resolveActiveShiftId(
    data.user.branch_id,
    register?.id,
  );
  const session = mapSession(data, register, activeShiftId, input.sessionMode);
  await saveTokenPair(data);
  return session;
}

export async function restoreSession(): Promise<LoginResult | null> {
  let tokenPair = await readTokenPair();
  let token = tokenPair?.accessToken;
  if (!token && tokenPair?.refreshToken) {
    token = await refreshSession();
  }

  if (!token) {
    return null;
  }

  try {
    const data = await apiFetch<Omit<LoginResponse, "token" | "refresh_token">>(
      "/auth/me",
      { token },
    );

    tokenPair = await readTokenPair();
    const activeToken = tokenPair?.accessToken ?? token;
    const register = await resolveRegister(data.user.branch_id, activeToken);
    const activeShiftId = await resolveActiveShiftId(
      data.user.branch_id,
      register?.id,
    );
    return mapSession(
      {
        ...data,
        token: activeToken,
        refresh_token: tokenPair?.refreshToken ?? "",
      },
      register,
      activeShiftId,
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      await clearStoredSession();
      useAppState.getState().setToken(undefined);
      return null;
    }
    throw error;
  }
}

export function configureAuthRefresh() {
  setAccessTokenRefresher(refreshSession);
}

export async function logoutSession() {
  const refreshToken = (await readTokenPair())?.refreshToken;
  await clearStoredSession();
  useAppState.getState().setToken(undefined);

  if (refreshToken) {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }
}

async function refreshSession(): Promise<string | undefined> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = rotateRefreshToken().finally(() => {
    refreshPromise = undefined;
  });
  return refreshPromise;
}

async function rotateRefreshToken(): Promise<string | undefined> {
  const refreshToken = (await readTokenPair())?.refreshToken;
  if (!refreshToken) {
    return undefined;
  }

  try {
    const data = await apiFetch<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    await saveTokenPair(data);
    useAppState.getState().setToken(data.token);
    return data.token;
  } catch {
    await clearStoredSession();
    useAppState.getState().setToken(undefined);
    return undefined;
  }
}

async function resolveRegister(
  branchId: string | undefined,
  token: string,
  deviceId?: string,
): Promise<RegisterContext | undefined> {
  if (!branchId) {
    return undefined;
  }

  const registers = await apiFetch<ApiRegister[]>(
    `/registers?branch_id=${encodeURIComponent(branchId)}`,
    { token },
  );
  const register =
    registers.find((item) => item.device_identifier === deviceId) ??
    registers[0];

  if (!register) {
    throw new Error("No active register is configured for this branch.");
  }

  return {
    id: register.id,
    name: register.name,
  };
}

async function resolveActiveShiftId(
  branchId?: string,
  registerId?: string,
): Promise<string | undefined> {
  if (!branchId || !registerId) {
    return undefined;
  }

  try {
    return (await getLocalActiveShift(branchId, registerId))?.id;
  } catch {
    return undefined;
  }
}
