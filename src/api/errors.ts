export class VolvoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "VolvoApiError";
  }
}

type ErrorNode = { code?: string; message?: string; description?: string; details?: unknown };

export async function readError(response: Response): Promise<VolvoApiError> {
  let bodyText = "";
  try {
    bodyText = await response.clone().text();
  } catch {
    // ignore
  }
  let payload: unknown;
  try {
    payload = bodyText ? JSON.parse(bodyText) : undefined;
  } catch {
    // body wasn't JSON
  }
  // Volvo exposes two error shapes:
  //   - Location / Energy: `{ error: { message: "STATUS_NAME", description: "Human text", code?, details? } }`
  //     where `description` is the user-actionable string and `message` is the status name.
  //   - Connected Vehicle v2: a flat `{ code: "VEHICLE_NOT_FOUND", message: "Human text", details? }`.
  // Support both so the flat shape doesn't get dumped as raw JSON.
  const envelope = (payload as { error?: ErrorNode })?.error;
  const flat =
    !envelope && payload && typeof payload === "object"
      ? (payload as ErrorNode)
      : undefined;
  const node = envelope ?? flat;
  const description =
    node?.description ??
    node?.message ??
    (typeof payload === "object" && payload && "description" in payload
      ? String((payload as { description: unknown }).description)
      : "");
  const composed = description
    ? `HTTP ${response.status} — ${description}`
    : bodyText
      ? `HTTP ${response.status} — ${bodyText.slice(0, 200)}`
      : `HTTP ${response.status}`;
  return new VolvoApiError(composed, response.status, node?.code ?? envelope?.message, node?.details ?? bodyText);
}

/**
 * If an error reads like one of Volvo's market/region gates (an out-of-market
 * vehicle, or the geo-restricted Location API), return a short actionable hint;
 * otherwise null. These are most often triggered by a VPN whose exit lands in a
 * different market than the car's registration.
 */
export function regionRestrictionHint(error: unknown): string | null {
  if (!error) return null;
  const err = error as { code?: string; message?: string };
  const haystack = `${typeof err.code === "string" ? err.code : ""} ${typeof err.message === "string" ? err.message : ""}`;
  if (/allowed markets|not allowed to access|out[- ]of[- ]market|wrong market/i.test(haystack)) {
    return (
      "This looks like a regional restriction. Volvo blocks requests that appear to come " +
      "from a different market than your car's. If you're on a VPN, switch to an exit in " +
      "your car's home region (e.g. EU), or turn it off."
    );
  }
  return null;
}
