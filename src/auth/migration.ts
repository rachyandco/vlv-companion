// Volvo ID moved from PingFederate (volvoid.eu.volvocars.com) to Keycloak
// (auth.volvocars.com) — see https://developer.volvocars.com/news/volvoid-migration/.
// Applications created on the old service have client ids starting with "dc-"
// and are rejected by the new endpoints; the old service itself shuts down on
// 31 January 2027. Users must create a fresh application, which gets a
// "vid-" prefixed client id (e.g. "vid-dcr-…") and a new secret.

export function isLegacyClientId(clientId: string): boolean {
  return /^dc-/i.test(clientId.trim());
}
