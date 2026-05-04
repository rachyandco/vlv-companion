import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";

import { DEEP_LINK_URI as DEEP_LINK, VOLVO_OAUTH, type StoredTokens } from "./config";
import { clearTokens, loadTokens, saveTokens } from "./storage";
import { getRuntimeConfig } from "@/lib/runtimeConfig";
import { randomHex } from "@/api/trace";

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: VOLVO_OAUTH.authorizationEndpoint,
  tokenEndpoint: VOLVO_OAUTH.tokenEndpoint,
  revocationEndpoint: VOLVO_OAUTH.revocationEndpoint,
};

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; tokens: StoredTokens };

export type SignInOptions = {
  /**
   * OIDC `prompt` value sent to /authorize. Use "login" or "login consent"
   * from Reconnect flows to force Volvo's IdP to re-run the vehicle-picker
   * consent screen — otherwise the IdP can replay a cached session with no
   * vehicles authorised, which makes /vehicles return an empty list.
   */
  prompt?: string;
};

type AuthContextValue = {
  state: AuthState;
  signIn: (options?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
  /** Returns a fresh access token, refreshing if needed. Throws on failure. */
  getAccessToken: () => Promise<string>;
  /** Forces a refresh-token exchange regardless of local expiry. Used by the API client on 401. */
  forceRefreshAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_LEEWAY_MS = 60_000;


export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const refreshInFlight = useRef<Promise<StoredTokens> | null>(null);
  const signInInFlight = useRef<{ promise: Promise<void>; options?: SignInOptions } | null>(null);
  // Mirror of the latest tokens, written synchronously by persist BEFORE
  // setState. getAccessToken / forceRefreshAccessToken read this ref instead
  // of the React `state` closure: a sequential second 401 after a refresh
  // completes would otherwise see the pre-refresh tokens (state hasn't been
  // re-read yet) and replay the already-consumed refresh_token, which Volvo
  // rejects with invalid_grant.
  const tokensRef = useRef<StoredTokens | null>(null);

  useEffect(() => {
    void (async () => {
      const tokens = await loadTokens();
      tokensRef.current = tokens ?? null;
      setState(tokens ? { status: "signed-in", tokens } : { status: "signed-out" });
    })();
  }, []);

  const persist = useCallback(async (tokens: StoredTokens) => {
    tokensRef.current = tokens;
    await saveTokens(tokens);
    setState({ status: "signed-in", tokens });
  }, []);

  const signIn = useCallback(async (options?: SignInOptions) => {
    // Coalesce concurrent sign-in attempts: WebBrowser.openAuthSessionAsync
    // doesn't tolerate overlap, and a double-tap could otherwise spawn two
    // browser sessions with mismatched PKCE/state. Only coalesce when the
    // new caller's options match the in-flight one — otherwise the second
    // caller silently gets the first call's result with the wrong prompt.
    if (signInInFlight.current) {
      if (sameSignInOptions(signInInFlight.current.options, options)) {
        return signInInFlight.current.promise;
      }
      throw new Error("A sign-in attempt is already in progress with different options. Please wait for it to finish.");
    }
    // The IIFE runs synchronously up to its first await, then yields. The
    // assignment to signInInFlight.current happens after the IIFE expression
    // evaluates but before any other JS task can run — JS is single-threaded
    // so no other signIn caller can observe the gap.
    const promise = (async () => {
    if (Platform.OS !== "android") {
      throw new Error("Only Android is supported.");
    }
    const { clientId, clientSecret, redirectUri, scopes: scopeString } = await getRuntimeConfig();
    if (!clientId) {
      throw new Error("OAuth client_id is not set. Add it in Settings.");
    }
    if (!redirectUri) {
      throw new Error("Redirect URI is not set. Add it in Settings.");
    }
    const scopes = scopeString.split(/\s+/).filter(Boolean);
    if (scopes.length === 0) {
      throw new Error("No OAuth scopes configured.");
    }
    // OIDC ("openid" scope) flows require nonce on many CIAMs (incl. Ping,
    // which is what Volvo's volvoid endpoint uses). Generate one alongside PKCE.
    const nonce = randomHex(16);
    const extraParams: Record<string, string> = { nonce };
    if (options?.prompt) extraParams.prompt = options.prompt;
    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      scopes,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
      extraParams,
    });
    const authorizeUrl = await request.makeAuthUrlAsync(DISCOVERY);
    if (__DEV__) {
      console.log("[auth] redirect_uri (sent to Volvo):", redirectUri);
      console.log("[auth] redirect_uri (caught by app):", DEEP_LINK);
      console.log("[auth] scopes:", scopes.join(" "));
    }

    // The redirectUri sent to /authorize is the user's HTTPS bridge. The bridge
    // page forwards via location.replace to DEEP_LINK, which is what the app's
    // intent-filter actually catches. Tell WebBrowser to wait on the deep link.
    const browserResult = await WebBrowser.openAuthSessionAsync(authorizeUrl, DEEP_LINK);
    if (__DEV__) console.log("[auth] browser result:", browserResult.type);
    if (browserResult.type !== "success" || !browserResult.url) {
      const reason = browserResult.type === "cancel" ? "Sign-in cancelled" : `Authorization ${browserResult.type}`;
      const err = new Error(reason) as Error & { authorizeUrl?: string };
      err.authorizeUrl = authorizeUrl;
      throw err;
    }

    const callbackUrl = new URL(browserResult.url);
    const code = callbackUrl.searchParams.get("code");
    const returnedState = callbackUrl.searchParams.get("state");
    const oauthError = callbackUrl.searchParams.get("error");
    if (oauthError) {
      const description = callbackUrl.searchParams.get("error_description");
      throw new Error(description ? `${oauthError}: ${description}` : oauthError);
    }
    if (!code) throw new Error("Authorization callback missing 'code'.");
    // Require the state round-trip on every flow — silently accepting a
    // missing returnedState would let an attacker who can plant a callback
    // bypass CSRF protection. AuthRequest always generates a state.
    if (!request.state) throw new Error("Authorization request had no local state.");
    if (!returnedState) throw new Error("Authorization callback missing 'state'.");
    if (returnedState !== request.state) throw new Error("Authorization state mismatch.");

    // PKCE is mandatory: AuthRequest sent a code_challenge to /authorize, so
    // the token endpoint *must* receive the matching code_verifier. Treat a
    // missing verifier as a bug, not a fall-through.
    if (!request.codeVerifier) {
      throw new Error("PKCE code_verifier missing from AuthRequest.");
    }

    // The token exchange must use the SAME redirect_uri that was sent to /authorize
    // (i.e. the HTTPS bridge), per RFC 6749. The deep link is purely a client-side
    // bounce and never reaches Volvo's servers.
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        clientSecret: clientSecret || undefined,
        code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      DISCOVERY,
    );
    // OIDC core 3.1.3.7: when an id_token is returned for an "openid" auth
    // request, its `nonce` claim must match the value we sent. We enforce this
    // strictly when the claim is present (replay protection), but tolerate its
    // absence — Volvo's Ping CIAM does not always propagate the nonce into the
    // id_token, and PKCE + state already cover the bulk of the threat model.
    if (tokenResult.idToken) {
      const idTokenNonce = readJwtNonce(tokenResult.idToken);
      if (idTokenNonce !== null && idTokenNonce !== nonce) {
        throw new Error("OIDC nonce mismatch in id_token.");
      }
      if (idTokenNonce === null && __DEV__) {
        console.warn("[auth] id_token has no nonce claim — replay protection downgraded to PKCE+state.");
      }
    }
    const tokens = toStoredTokens(tokenResult);
    await persist(tokens);
    })();
    signInInFlight.current = { promise, options };
    try {
      await promise;
    } finally {
      signInInFlight.current = null;
    }
  }, [persist]);

  const signOut = useCallback(async () => {
    tokensRef.current = null;
    await clearTokens();
    // Drop every cached query so vehicle data from the previous account
    // doesn't leak into the next session (e.g. on a shared phone). Without
    // this, a query like useEnergyCapabilities (24h staleTime) would briefly
    // show the prior owner's data after re-sign-in.
    queryClient.clear();
    setState({ status: "signed-out" });
  }, [queryClient]);

  const refresh = useCallback(async (current: StoredTokens): Promise<StoredTokens> => {
    if (!current.refreshToken) {
      tokensRef.current = null;
      await clearTokens();
      setState({ status: "signed-out" });
      throw new Error("No refresh token available; please sign in again.");
    }
    if (refreshInFlight.current) return refreshInFlight.current;
    // Assign the in-flight ref synchronously, before any await — otherwise
    // a second caller could pass the null guard and trigger a duplicate
    // refresh, which Volvo's IdP rejects with invalid_grant.
    const refreshToken = current.refreshToken;
    refreshInFlight.current = (async () => {
      const { clientId, clientSecret } = await getRuntimeConfig();
      if (!clientId) throw new Error("OAuth client_id missing.");
      const result = await AuthSession.refreshAsync(
        { clientId, clientSecret: clientSecret || undefined, refreshToken },
        DISCOVERY,
      );
      const tokens: StoredTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? refreshToken,
        expiresAt: computeExpiresAt(result.expiresIn),
        idToken: result.idToken ?? current.idToken,
      };
      // If signOut() ran while refreshAsync was in flight, tokensRef will
      // be null. Don't re-persist — that would resurrect the session and
      // silently re-authenticate the user on next launch.
      if (tokensRef.current === null) {
        throw new Error("Sign-out raced refresh; refresh result discarded.");
      }
      await persist(tokens);
      return tokens;
    })();
    try {
      return await refreshInFlight.current;
    } finally {
      refreshInFlight.current = null;
    }
  }, [persist]);

  // Read tokens from the ref, not React state — see tokensRef comment above.
  const getAccessToken = useCallback(async (): Promise<string> => {
    const tokens = tokensRef.current;
    if (!tokens) throw new Error("Not signed in.");
    const now = Date.now();
    if (tokens.expiresAt - REFRESH_LEEWAY_MS > now) {
      return tokens.accessToken;
    }
    const refreshed = await refresh(tokens);
    return refreshed.accessToken;
  }, [refresh]);

  const forceRefreshAccessToken = useCallback(async (): Promise<string> => {
    const tokens = tokensRef.current;
    if (!tokens) throw new Error("Not signed in.");
    const refreshed = await refresh(tokens);
    return refreshed.accessToken;
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signOut, getAccessToken, forceRefreshAccessToken }),
    [forceRefreshAccessToken, getAccessToken, signIn, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

function sameSignInOptions(a: SignInOptions | undefined, b: SignInOptions | undefined): boolean {
  return (a?.prompt ?? "") === (b?.prompt ?? "");
}

function toStoredTokens(result: AuthSession.TokenResponse): StoredTokens {
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? null,
    expiresAt: computeExpiresAt(result.expiresIn),
    idToken: result.idToken ?? null,
  };
}

function computeExpiresAt(expiresIn?: number): number {
  const seconds = expiresIn && expiresIn > 0 ? expiresIn : 3600;
  return Date.now() + seconds * 1000;
}

function readJwtNonce(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  // A malformed payload shouldn't fail sign-in: the caller treats null as
  // "no nonce" and downgrades to PKCE+state. Wrap the decode steps so a
  // bad base64 / JSON value doesn't surface as a confusing top-level error.
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64)) as { nonce?: unknown };
    return typeof json.nonce === "string" ? json.nonce : null;
  } catch {
    return null;
  }
}
