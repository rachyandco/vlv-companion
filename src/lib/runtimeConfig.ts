import { DEFAULT_REDIRECT_URI, DEFAULT_SCOPES } from "@/auth/config";
import { isLegacyClientId } from "@/auth/migration";
import {
  getRuntimeClientId,
  getRuntimeClientSecret,
  getRuntimeRedirectUri,
  getRuntimeScopes,
  getRuntimeVccApiKey,
  setRuntimeClientId,
  setRuntimeClientSecret,
  setRuntimeRedirectUri,
  setRuntimeScopes,
  setRuntimeVccApiKey,
} from "@/auth/storage";

type RuntimeConfig = {
  clientId: string;
  clientSecret: string;
  vccApiKey: string;
  redirectUri: string;
  /** Space-separated list of OAuth scopes to request. */
  scopes: string;
};

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const [storedClientId, storedSecret, storedKey, storedRedirect, storedScopes] =
    await Promise.all([
      getRuntimeClientId(),
      getRuntimeClientSecret(),
      getRuntimeVccApiKey(),
      getRuntimeRedirectUri(),
      getRuntimeScopes(),
    ]);
  return {
    clientId: storedClientId?.trim() ?? "",
    clientSecret: storedSecret?.trim() ?? "",
    vccApiKey: storedKey?.trim() ?? "",
    redirectUri: storedRedirect?.trim() || DEFAULT_REDIRECT_URI,
    scopes: storedScopes?.trim() || DEFAULT_SCOPES.join(" "),
  };
}

export async function setRuntimeConfig(next: Partial<RuntimeConfig>): Promise<void> {
  if (next.redirectUri !== undefined && next.redirectUri !== "") {
    // Volvo's portal rejects custom-scheme redirect URIs, and a non-HTTPS
    // bridge would leak the auth code in transit. Require an actual host
    // segment too — the bare scheme `https://` would otherwise sail through
    // and surface as a confusing Volvo error instead of a local one.
    if (!/^https:\/\/[^/]+/i.test(next.redirectUri.trim())) {
      throw new Error("Redirect URI must start with https:// and include a host.");
    }
  }
  if (next.clientId !== undefined) await setRuntimeClientId(next.clientId);
  if (next.clientSecret !== undefined) await setRuntimeClientSecret(next.clientSecret);
  if (next.vccApiKey !== undefined) await setRuntimeVccApiKey(next.vccApiKey);
  if (next.redirectUri !== undefined) await setRuntimeRedirectUri(next.redirectUri);
  if (next.scopes !== undefined) await setRuntimeScopes(next.scopes);
}

/**
 * Runs on every launch before the auth state is derived. Reports whether the
 * stored client id is a retired `dc-` one (pre-Keycloak Volvo ID) so the
 * caller can drop tokens that the new service would refuse to refresh.
 */
export async function migrateRuntimeConfig(): Promise<{ legacyClient: boolean }> {
  const storedClientId = await getRuntimeClientId();
  return { legacyClient: isLegacyClientId(storedClientId ?? "") };
}
