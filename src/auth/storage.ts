import * as SecureStore from "expo-secure-store";

import type { StoredTokens } from "./config";

const TOKENS_KEY = "volvo.tokens.v1";
const RUNTIME_CLIENT_ID = "volvo.runtime.clientId";
const RUNTIME_CLIENT_SECRET = "volvo.runtime.clientSecret";
const RUNTIME_VCC_KEY = "volvo.runtime.vccApiKey";
const RUNTIME_REDIRECT_URI = "volvo.runtime.redirectUri";
const RUNTIME_SCOPES = "volvo.runtime.scopes";

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  // Validate the shape — an old-schema entry could otherwise produce
  // {accessToken: undefined} typed as StoredTokens and break every API call.
  if (!isStoredTokens(parsed)) {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    return null;
  }
  return parsed;
}

function isStoredTokens(value: unknown): value is StoredTokens {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.accessToken === "string" &&
    v.accessToken.length > 0 &&
    (v.refreshToken === null || typeof v.refreshToken === "string") &&
    typeof v.expiresAt === "number" &&
    (v.idToken === null || typeof v.idToken === "string")
  );
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

export async function setRuntimeClientId(value: string): Promise<void> {
  await SecureStore.setItemAsync(RUNTIME_CLIENT_ID, value);
}

export async function getRuntimeClientId(): Promise<string | null> {
  return SecureStore.getItemAsync(RUNTIME_CLIENT_ID);
}

export async function setRuntimeVccApiKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(RUNTIME_VCC_KEY, value);
}

export async function getRuntimeVccApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(RUNTIME_VCC_KEY);
}

export async function setRuntimeRedirectUri(value: string): Promise<void> {
  await SecureStore.setItemAsync(RUNTIME_REDIRECT_URI, value);
}

export async function getRuntimeRedirectUri(): Promise<string | null> {
  return SecureStore.getItemAsync(RUNTIME_REDIRECT_URI);
}

export async function setRuntimeClientSecret(value: string): Promise<void> {
  await SecureStore.setItemAsync(RUNTIME_CLIENT_SECRET, value);
}

export async function getRuntimeClientSecret(): Promise<string | null> {
  return SecureStore.getItemAsync(RUNTIME_CLIENT_SECRET);
}

export async function setRuntimeScopes(value: string): Promise<void> {
  await SecureStore.setItemAsync(RUNTIME_SCOPES, value);
}

export async function getRuntimeScopes(): Promise<string | null> {
  return SecureStore.getItemAsync(RUNTIME_SCOPES);
}
