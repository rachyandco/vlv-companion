// Volvo ID (Keycloak) endpoints, as published by
// https://auth.volvocars.com/realms/volvocars/.well-known/openid-configuration.
// The previous PingFederate service at volvoid.eu.volvocars.com shuts down on
// 31 January 2027 and only accepts the retired "dc-" client ids — see
// src/auth/migration.ts.
export const VOLVO_OAUTH = {
  issuer: "https://auth.volvocars.com/realms/volvocars",
  authorizationEndpoint: "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/auth",
  tokenEndpoint: "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/token",
  revocationEndpoint: "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/revoke",
} as const;

// Custom-scheme URI the app's intent filter catches. The HTTPS bridge bounces
// the OAuth response here via location.replace.
export const DEEP_LINK_URI = "volvo-companion://oauth/callback";

// Default OAuth redirect_uri sent to Volvo. Volvo's portal rejects custom-scheme
// URIs, so this is an HTTPS bridge that re-deeplinks back into the app.
//
// Trust assumption: PKCE binds the auth code to this device, so a hostile
// bridge owner can't exchange the code for a token. The exposure is
// availability — if this domain stops serving the bridge page, sign-in
// breaks. Users who don't trust the default should host the page from
// `redirect/` themselves and override the URI in Settings.
export const DEFAULT_REDIRECT_URI = "https://volvo.roussel-zeter.eu/redirect/";

// Note: `offline_access` is deliberately absent. Keycloak would normally need
// it for a refresh token that outlives the SSO session, but the developer
// portal does not grant it to third-party clients — requesting it fails the
// whole /authorize call with invalid_scope (verified 2026-11-06).
export const DEFAULT_SCOPES = [
  "openid",
  "conve:vehicle_relation",
  "conve:fuel_status",
  "conve:battery_charge_level",
  "conve:odometer_status",
  "conve:doors_status",
  "conve:windows_status",
  "conve:lock_status",
  "conve:lock",
  "conve:unlock",
  "conve:tyre_status",
  "conve:engine_status",
  "conve:engine_start_stop",
  "conve:climatization_start_stop",
  "conve:honk_flash",
  "conve:warnings",
  "conve:diagnostics_engine_status",
  "conve:diagnostics_workshop",
  "conve:brake_status",
  "conve:command_accessibility",
  "conve:commands",
  "conve:trip_statistics",
  "energy:state:read",
  "energy:capability:read",
  "location:read",
];

export const API_BASE = "https://api.volvocars.com";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  idToken: string | null;
};
