import { randomBytes } from "node:crypto";

type BridgeEntry = {
  cookieHeader: string;
  state: string;
  expiresAt: number;
};

const CODE_TTL_MS = 60 * 1000;
const bridgeStore = new Map<string, BridgeEntry>();

function cleanupExpiredCodes(now = Date.now()) {
  for (const [code, entry] of bridgeStore.entries()) {
    if (entry.expiresAt <= now) {
      bridgeStore.delete(code);
    }
  }
}

export function createExtensionBridgeCode(input: {
  cookieHeader: string;
  state: string;
}) {
  cleanupExpiredCodes();
  const code = randomBytes(24).toString("hex");
  bridgeStore.set(code, {
    cookieHeader: input.cookieHeader,
    state: input.state,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
}

export function consumeExtensionBridgeCode(input: { code: string; state: string }) {
  cleanupExpiredCodes();
  const entry = bridgeStore.get(input.code);
  if (!entry) return null;

  bridgeStore.delete(input.code);

  if (entry.state !== input.state) {
    return null;
  }

  return {
    cookieHeader: entry.cookieHeader,
  };
}
