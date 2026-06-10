import { app, safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

type StoredAuthSession = {
  version: 1;
  encrypted: string;
};

const sessionFileName = "auth-session.json";
const maxTokenLength = 8_192;

const getSessionFilePath = () =>
  path.join(app.getPath("userData"), sessionFileName);

export function readAuthSession(): AuthTokenPair | null {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  const sessionFilePath = getSessionFilePath();
  if (!fs.existsSync(sessionFilePath)) {
    return null;
  }

  try {
    const stored = JSON.parse(
      fs.readFileSync(sessionFilePath, "utf8"),
    ) as StoredAuthSession;
    const decrypted = safeStorage.decryptString(
      Buffer.from(stored.encrypted, "base64"),
    );
    const tokenPair = JSON.parse(decrypted) as unknown;

    if (!isAuthTokenPair(tokenPair)) {
      clearAuthSession();
      return null;
    }

    return tokenPair;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function writeAuthSession(tokenPair: AuthTokenPair): boolean {
  assertAuthTokenPair(tokenPair);

  if (!safeStorage.isEncryptionAvailable()) {
    return false;
  }

  const sessionFilePath = getSessionFilePath();
  const temporaryPath = `${sessionFilePath}.${process.pid}.tmp`;
  const stored: StoredAuthSession = {
    version: 1,
    encrypted: safeStorage
      .encryptString(JSON.stringify(tokenPair))
      .toString("base64"),
  };

  fs.mkdirSync(path.dirname(sessionFilePath), { recursive: true });
  fs.writeFileSync(temporaryPath, JSON.stringify(stored), { mode: 0o600 });
  fs.renameSync(temporaryPath, sessionFilePath);
  return true;
}

export function clearAuthSession(): void {
  fs.rmSync(getSessionFilePath(), { force: true });
}

function assertAuthTokenPair(value: unknown): asserts value is AuthTokenPair {
  if (!isAuthTokenPair(value)) {
    throw new Error("Invalid auth session payload.");
  }
}

function isAuthTokenPair(value: unknown): value is AuthTokenPair {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthTokenPair>;
  return (
    isValidToken(candidate.accessToken) && isValidToken(candidate.refreshToken)
  );
}

function isValidToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxTokenLength
  );
}
